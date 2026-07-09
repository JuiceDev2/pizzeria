"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface OrderItemDetalle {
  id: string;
  qty: number;
  price: number;
  size: string | null;
  style: string | null;
  orilla_queso: boolean;
  product_name: string;
  flavor_name: string | null;
}

export function OrderRow({
  id,
  status,
  total,
  createdAt,
}: {
  id: string;
  status: string;
  total: number;
  createdAt: string;
}) {
  const supabase = createClient();
  const [expanded, setExpanded] = useState(false);
  const [items, setItems] = useState<OrderItemDetalle[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (expanded) {
      setExpanded(false);
      return;
    }
    setExpanded(true);

    if (items !== null) return; // ya se cargaron antes, no repetir el fetch

    setLoading(true);
    const { data } = await supabase
      .from("order_items")
      .select(
        "id, qty, price, size, style, orilla_queso, products(name), flavors(name)"
      )
      .eq("order_id", id);

    const rows: OrderItemDetalle[] = (data ?? []).map((r: any) => ({
      id: r.id,
      qty: r.qty,
      price: r.price,
      size: r.size,
      style: r.style,
      orilla_queso: r.orilla_queso,
      product_name: r.products?.name ?? "—",
      flavor_name: r.flavors?.name ?? null,
    }));
    setItems(rows);
    setLoading(false);
  }

  return (
    <>
      <tr
        onClick={toggle}
        className="cursor-pointer hover:bg-neutral-50 transition"
      >
        <td className="px-4 py-2 text-neutral-700">
          {new Date(createdAt).toLocaleString("es-MX")}
        </td>
        <td className="px-4 py-2 text-neutral-700">{status}</td>
        <td className="px-4 py-2 text-neutral-900 font-medium">${total}</td>
        <td className="px-4 py-2 text-neutral-400 text-xs">
          {expanded ? "▲ ocultar" : "▼ ver detalle"}
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={4} className="px-4 py-3 bg-neutral-50">
            {loading && (
              <p className="text-sm text-neutral-400">Cargando detalle...</p>
            )}
            {items && items.length === 0 && (
              <p className="text-sm text-neutral-400">Sin productos registrados.</p>
            )}
            {items && items.length > 0 && (
              <ul className="text-sm text-neutral-700 space-y-1">
                {items.map((item) => (
                  <li key={item.id} className="flex justify-between">
                    <span>
                      {item.qty}x {item.product_name}
                      {item.flavor_name ? ` (${item.flavor_name})` : ""}
                      {item.size ? ` - ${item.size}` : ""}
                      {item.style ? ` ${item.style}` : ""}
                      {item.orilla_queso ? " + orilla de queso" : ""}
                    </span>
                    <span className="text-neutral-500">
                      ${item.price * item.qty}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </td>
        </tr>
      )}
    </>
  );
}
