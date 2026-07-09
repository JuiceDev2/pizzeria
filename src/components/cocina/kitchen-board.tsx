"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { OrderCardData } from "@/types/database";

const QUINCE_MIN_MS = 15 * 60 * 1000;

function getEstadoVisual(order: OrderCardData): "pendiente" | "en_proceso" | "lista" {
  if (order.status === "lista") return "lista";
  const transcurrido = Date.now() - new Date(order.created_at).getTime();
  return transcurrido > QUINCE_MIN_MS ? "en_proceso" : "pendiente";
}

export function KitchenBoard({
  initialOrders,
}: {
  initialOrders: OrderCardData[];
}) {
  const [orders, setOrders] = useState(initialOrders);
  const supabase = createClient();

  // Re-render cada 30s para que "en proceso" aparezca sin recargar la página
  useEffect(() => {
    const interval = setInterval(() => setOrders((prev) => [...prev]), 30_000);
    return () => clearInterval(interval);
  }, []);

  // Suscripción realtime: solo a cambios en 'orders', columnas mínimas
  useEffect(() => {
    const channel = supabase
      .channel("cocina-orders")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        (payload) => {
          const nueva = payload.new as OrderCardData;
          setOrders((prev) => [...prev, { ...nueva, order_items: [] }]);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        (payload) => {
          const actualizada = payload.new as OrderCardData;
          if (actualizada.status === "lista" || actualizada.status === "cancelada") {
            setOrders((prev) => prev.filter((o) => o.id !== actualizada.id));
          } else {
            setOrders((prev) =>
              prev.map((o) => (o.id === actualizada.id ? { ...o, ...actualizada } : o))
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  async function marcarLista(orderId: string) {
    // Optimista: la quitamos de la vista de inmediato
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    await supabase.from("orders").update({ status: "lista" }).eq("id", orderId);
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {orders.length === 0 && (
        <p className="text-neutral-400 col-span-full text-center py-12">
          No hay órdenes pendientes.
        </p>
      )}
      {orders.map((order) => {
        const estado = getEstadoVisual(order);
        return (
          <div
            key={order.id}
            className={
              "rounded-xl p-4 border " +
              (estado === "en_proceso"
                ? "bg-cheese/10 border-cheese"
                : "bg-neutral-800 border-neutral-700")
            }
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-neutral-100 font-medium">
                Orden #{order.id.slice(0, 6)}
              </span>
              <span
                className={
                  "text-xs px-2 py-0.5 rounded-full " +
                  (estado === "en_proceso"
                    ? "bg-cheese text-neutral-900"
                    : "bg-neutral-700 text-neutral-300")
                }
              >
                {estado === "en_proceso" ? "En proceso" : "Pendiente"}
              </span>
            </div>
            <ul className="text-sm text-neutral-300 space-y-1 mb-3">
              {order.order_items.map((item) => (
                <li key={item.id}>
                  {item.qty}x {item.size ?? ""} {item.style ?? ""}
                  {item.orilla_queso ? " + orilla de queso" : ""}
                </li>
              ))}
            </ul>
            <button
              onClick={() => marcarLista(order.id)}
              className="w-full bg-basil text-white text-sm rounded-md py-3 hover:bg-basil/90 active:scale-[0.98] transition"
            >
              Marcar como lista
            </button>
          </div>
        );
      })}
    </div>
  );
}
