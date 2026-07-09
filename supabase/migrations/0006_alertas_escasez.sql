-- =========================================================
-- 0006_alertas_escasez.sql
-- crear_orden ahora también informa qué ingredientes quedaron
-- por debajo de su umbral mínimo tras descontar la venta.
-- =========================================================

drop function if exists crear_orden(jsonb);

create or replace function crear_orden(items jsonb)
returns jsonb
language plpgsql
security definer
as $$
declare
  nueva_orden_id uuid;
  item jsonb;
  receta record;
  total_calculado numeric(10, 2) := 0;
  stock_resultante numeric(12, 2);
  escasos jsonb := '[]'::jsonb;
begin
  if auth_role() <> 'mesero' then
    raise exception 'Solo un mesero puede crear ordenes';
  end if;

  select coalesce(sum((i->>'price')::numeric * (i->>'qty')::int), 0)
  into total_calculado
  from jsonb_array_elements(items) as i;

  insert into orders (mesero_id, status, total)
  values (auth.uid(), 'pendiente', total_calculado)
  returning id into nueva_orden_id;

  for item in select * from jsonb_array_elements(items)
  loop
    insert into order_items (
      order_id, product_id, flavor_id, size, style, orilla_queso, price, qty
    ) values (
      nueva_orden_id,
      (item->>'product_id')::uuid,
      nullif(item->>'flavor_id', '')::uuid,
      item->>'size',
      nullif(item->>'style', '')::pizza_style,
      coalesce((item->>'orilla_queso')::boolean, false),
      (item->>'price')::numeric,
      (item->>'qty')::int
    );

    for receta in
      select r.ingredient_id, r.grams_used, ing.name as ingredient_name,
             ing.min_threshold_grams
      from recipes r
      join ingredients ing on ing.id = r.ingredient_id
      where r.product_id = (item->>'product_id')::uuid
        and (r.flavor_id = nullif(item->>'flavor_id', '')::uuid or r.flavor_id is null)
    loop
      update ingredients
      set stock_grams = stock_grams - (receta.grams_used * (item->>'qty')::int),
          updated_at = now()
      where id = receta.ingredient_id
      returning stock_grams into stock_resultante;

      if stock_resultante < 0 then
        raise exception 'Stock insuficiente para el ingrediente %', receta.ingredient_name;
      end if;

      if stock_resultante < receta.min_threshold_grams then
        escasos := escasos || jsonb_build_object(
          'ingredient_id', receta.ingredient_id,
          'name', receta.ingredient_name,
          'stock_grams', stock_resultante
        );
      end if;
    end loop;
  end loop;

  return jsonb_build_object('order_id', nueva_orden_id, 'escasos', escasos);
end;
$$;
