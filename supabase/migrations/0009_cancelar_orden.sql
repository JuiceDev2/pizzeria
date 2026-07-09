-- =========================================================
-- 0009_cancelar_orden.sql
-- Cancela una orden pendiente/lista y devuelve al inventario
-- los gramos que se habían descontado por sus items —
-- reversa exacta de lo que hizo crear_orden().
-- =========================================================

create or replace function cancelar_orden(orden_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  orden record;
  item record;
  receta record;
begin
  if auth_role() not in ('supervisor', 'propietario') then
    raise exception 'No tienes permiso para cancelar órdenes';
  end if;

  select * into orden from orders where id = orden_id for update;

  if orden is null then
    raise exception 'La orden no existe';
  end if;

  if orden.status = 'entregada' then
    raise exception 'No se puede cancelar una orden ya entregada';
  end if;

  if orden.status = 'cancelada' then
    return; -- ya estaba cancelada, no hay nada que hacer
  end if;

  -- Devuelve el inventario de cada item de la orden
  for item in select * from order_items where order_id = orden_id
  loop
    for receta in
      select r.ingredient_id, r.grams_used
      from recipes r
      where r.product_id = item.product_id
        and (r.flavor_id = item.flavor_id or r.flavor_id is null)
    loop
      update ingredients
      set stock_grams = stock_grams + (receta.grams_used * item.qty),
          updated_at = now()
      where id = receta.ingredient_id;
    end loop;
  end loop;

  update orders set status = 'cancelada' where id = orden_id;
end;
$$;
