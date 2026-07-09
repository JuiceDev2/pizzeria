-- =========================================================
-- 0007_producibles_function.sql
-- Calcula, para cada combinación producto (+sabor), cuántas
-- piezas se pueden hacer con el stock actual — tomando el
-- ingrediente más limitante de su receta. Todo en Postgres,
-- el cliente solo recibe el resultado ya calculado.
-- =========================================================

create or replace function get_producibles()
returns table (
  product_id uuid,
  product_name text,
  flavor_id uuid,
  flavor_name text,
  cantidad_disponible integer
)
language sql
security definer
stable
as $$
  with combos as (
    -- Producto + sabor específico (pizza/boneless/papas/bebida con sabores)
    select p.id as product_id, p.name as product_name,
           f.id as flavor_id, f.name as flavor_name
    from products p
    join flavors f on f.product_category = p.category and f.active
    where p.active
      and exists (
        select 1 from recipes r
        where r.product_id = p.id and (r.flavor_id = f.id or r.flavor_id is null)
      )

    union all

    -- Producto sin sabor definido en absoluto (ej. una bebida simple)
    select p.id, p.name, null::uuid, null::text
    from products p
    where p.active
      and not exists (select 1 from flavors f where f.product_category = p.category)
      and exists (select 1 from recipes r where r.product_id = p.id and r.flavor_id is null)
  )
  select
    c.product_id,
    c.product_name,
    c.flavor_id,
    c.flavor_name,
    floor(min(i.stock_grams / r.grams_used))::int as cantidad_disponible
  from combos c
  join recipes r
    on r.product_id = c.product_id
   and (r.flavor_id = c.flavor_id or r.flavor_id is null)
  join ingredients i on i.id = r.ingredient_id
  group by c.product_id, c.product_name, c.flavor_id, c.flavor_name
  order by c.product_name, c.flavor_name;
$$;
