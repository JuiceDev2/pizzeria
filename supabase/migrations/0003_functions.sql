-- =========================================================
-- 0003_functions.sql
-- Funciones RPC: mantienen la lógica pesada en Postgres,
-- así el cliente hace UNA sola llamada en vez de varias.
-- =========================================================

-- ---------------------------------------------------------
-- crear_orden: crea la orden + sus items, y descuenta el
-- inventario de forma transaccional y con bloqueo de filas
-- para evitar condiciones de carrera entre meseros.
-- ---------------------------------------------------------
create or replace function crear_orden(items jsonb)
returns uuid
language plpgsql
security definer
as $$
declare
  nueva_orden_id uuid;
  item jsonb;
  receta record;
  total_calculado numeric(10, 2) := 0;
  stock_resultante numeric(12, 2);
begin
  if auth_role() <> 'mesero' then
    raise exception 'Solo un mesero puede crear ordenes';
  end if;

  -- Total = suma de price * qty de cada item recibido
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

    -- Descuenta ingredientes según receta (bloqueando filas para evitar
    -- que dos ordenes concurrentes lean el mismo stock "viejo")
    for receta in
      select r.ingredient_id, r.grams_used
      from recipes r
      where r.product_id = (item->>'product_id')::uuid
        and (r.flavor_id = nullif(item->>'flavor_id', '')::uuid or r.flavor_id is null)
    loop
      -- El UPDATE ya bloquea la fila (equivalente a SELECT ... FOR UPDATE),
      -- así que dos ordenes concurrentes no pueden leer el mismo stock "viejo".
      update ingredients
      set stock_grams = stock_grams - (receta.grams_used * (item->>'qty')::int),
          updated_at = now()
      where id = receta.ingredient_id
      returning stock_grams into stock_resultante;

      if stock_resultante < 0 then
        raise exception 'Stock insuficiente para el ingrediente %', receta.ingredient_id;
      end if;
    end loop;
  end loop;

  return nueva_orden_id;
end;
$$;

-- ---------------------------------------------------------
-- get_ventas_hoy: agregado de ventas del día actual.
-- Devuelve UNA fila en vez de traer todas las ordenes al cliente.
-- ---------------------------------------------------------
create or replace function get_ventas_hoy()
returns table (
  total numeric,
  ordenes bigint,
  ticket_promedio numeric
)
language sql
security definer
stable
as $$
  select
    coalesce(sum(total), 0) as total,
    count(*) as ordenes,
    coalesce(round(avg(total), 2), 0) as ticket_promedio
  from orders
  where created_at >= date_trunc('day', now())
    and status <> 'cancelada';
$$;

-- ---------------------------------------------------------
-- get_productos_top: productos más vendidos (por cantidad).
-- ---------------------------------------------------------
create or replace function get_productos_top(limite int default 5)
returns table (
  producto text,
  cantidad bigint
)
language sql
security definer
stable
as $$
  select p.name as producto, sum(oi.qty) as cantidad
  from order_items oi
  join products p on p.id = oi.product_id
  join orders o on o.id = oi.order_id
  where o.status <> 'cancelada'
  group by p.name
  order by cantidad desc
  limit limite;
$$;
