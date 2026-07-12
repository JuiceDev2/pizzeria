-- =========================================================
-- 0010_ticket_publico.sql
-- Permite ver el detalle de UNA orden sin sesión iniciada,
-- para poder compartir un link de ticket por WhatsApp y que
-- se abra en cualquier navegador (cliente, otro empleado, etc).
--
-- Es security definer a propósito: NO abrimos RLS de `orders`
-- a anon (eso expondría todas las órdenes a quien sea). En vez
-- de eso, esta función solo permite consultar UNA orden a la vez,
-- y solo si ya conoces su id (UUID, no adivinable), y solo
-- devuelve los campos necesarios para un ticket — nada de datos
-- internos (mesero_id crudo, costos de receta, etc).
-- =========================================================

create or replace function get_ticket_publico(p_orden_id uuid)
returns jsonb
language plpgsql
security definer
stable
as $$
declare
  resultado jsonb;
begin
  select jsonb_build_object(
    'id', o.id,
    'folio', upper(substr(o.id::text, 1, 8)),
    'status', o.status,
    'total', o.total,
    'created_at', o.created_at,
    'mesero', coalesce(p.name, 'Mesero'),
    'items', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'qty', oi.qty,
          'producto', coalesce(prod.name, 'Producto'),
          'sabor', fl.name,
          'size', oi.size,
          'style', oi.style,
          'orilla_queso', oi.orilla_queso,
          'price', oi.price
        )
        order by oi.id
      )
      from order_items oi
      left join products prod on prod.id = oi.product_id
      left join flavors fl on fl.id = oi.flavor_id
      where oi.order_id = o.id
    ), '[]'::jsonb)
  )
  into resultado
  from orders o
  left join profiles p on p.id = o.mesero_id
  where o.id = p_orden_id;

  return resultado; -- null si el id no existe
end;
$$;

-- Accesible sin sesión (anon) y con sesión (authenticated).
grant execute on function get_ticket_publico(uuid) to anon, authenticated;
