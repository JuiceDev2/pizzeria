-- =========================================================
-- 0005_historial_functions.sql
-- Agregado para un rango de fechas arbitrario (usado por el
-- historial con filtros). Evita sumar en el cliente cuando
-- el historial está paginado.
-- =========================================================

create or replace function get_ventas_rango(desde date, hasta date)
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
  where created_at >= desde
    and created_at < (hasta + 1)  -- incluye todo el día "hasta"
    and status <> 'cancelada';
$$;
