-- =========================================================
-- 0004_grafica_functions.sql
-- Agregados por día, listos para graficar sin traer las
-- órdenes crudas al cliente.
-- =========================================================

create or replace function get_ventas_por_dia(dias int default 7)
returns table (
  dia date,
  total numeric,
  ordenes bigint
)
language sql
security definer
stable
as $$
  with rango as (
    select generate_series(
      current_date - (dias - 1),
      current_date,
      interval '1 day'
    )::date as dia
  ),
  agregado as (
    select
      date_trunc('day', created_at)::date as dia,
      sum(total) as total,
      count(*) as ordenes
    from orders
    where created_at >= (current_date - (dias - 1))
      and status <> 'cancelada'
    group by dia
  )
  select
    r.dia,
    coalesce(a.total, 0) as total,
    coalesce(a.ordenes, 0) as ordenes
  from rango r
  left join agregado a on a.dia = r.dia
  order by r.dia;
$$;
