"use client";

import { useState } from "react";

export interface TicketListItem {
  id: string;
  created_at: string;
  total: number;
  status: string;
  mesero_name?: string;
}

const ESTADO_LABEL: Record<string, string> = {
  pendiente: "Pendiente",
  lista: "Lista",
  entregada: "Entregada",
  cancelada: "Cancelada",
};

const ESTADO_COLOR: Record<string, string> = {
  pendiente: "text-cheese",
  lista: "text-basil",
  entregada: "text-neutral-500",
  cancelada: "text-tomato",
};

function ticketUrl(id: string) {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/ticket/${id}`;
}

export function TicketsList({ orders }: { orders: TicketListItem[] }) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function copiarLink(id: string) {
    try {
      await navigator.clipboard.writeText(ticketUrl(id));
      setCopiedId(id);
      setTimeout(() => setCopiedId((v) => (v === id ? null : v)), 1800);
    } catch {
      // Si el navegador bloquea el clipboard, no pasa nada grave;
      // el usuario puede copiar el link manualmente desde "Ver ticket".
    }
  }

  function enviarWhatsapp(order: TicketListItem) {
    const folio = order.id.slice(0, 8).toUpperCase();
    const fecha = new Date(order.created_at).toLocaleString("es-MX", {
      dateStyle: "medium",
      timeStyle: "short",
    });
    const mensaje =
      `🍕 Ticket #${folio}\n` +
      `${fecha}\n` +
      `Total: $${order.total.toFixed(2)}\n\n` +
      `Ver detalle: ${ticketUrl(order.id)}`;

    window.open(
      `https://wa.me/?text=${encodeURIComponent(mensaje)}`,
      "_blank"
    );
  }

  if (orders.length === 0) {
    return (
      <p className="text-sm text-neutral-400 text-center py-8">
        No hay tickets todavía.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {orders.map((order) => (
        <li
          key={order.id}
          className="bg-white border border-neutral-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-neutral-900">
                #{order.id.slice(0, 8).toUpperCase()}
              </span>
              <span
                className={
                  "text-xs font-medium " +
                  (ESTADO_COLOR[order.status] ?? "text-neutral-500")
                }
              >
                {ESTADO_LABEL[order.status] ?? order.status}
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              {new Date(order.created_at).toLocaleString("es-MX", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
              {order.mesero_name ? ` · ${order.mesero_name}` : ""}
            </p>
            <p className="text-sm font-semibold text-crust mt-1">
              ${order.total.toFixed(2)}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <a
              href={`/ticket/${order.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-3 py-2 rounded-md border border-neutral-300 text-neutral-600 hover:bg-neutral-50 transition"
            >
              Ver ticket
            </a>
            <button
              onClick={() => copiarLink(order.id)}
              className="text-xs px-3 py-2 rounded-md border border-neutral-300 text-neutral-600 hover:bg-neutral-50 transition"
            >
              {copiedId === order.id ? "¡Copiado!" : "Copiar link"}
            </button>
            <button
              onClick={() => enviarWhatsapp(order)}
              className="text-xs px-3 py-2 rounded-md bg-basil text-white hover:bg-basil/90 transition"
            >
              WhatsApp
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
