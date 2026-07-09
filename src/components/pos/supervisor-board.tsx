"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { OrderCardData } from "@/types/database";

const TREINTA_MIN_MS = 30 * 60 * 1000;

export function SupervisorBoard({
  initialOrders,
}: {
  initialOrders: OrderCardData[];
}) {
  const supabase = createClient();
  const [orders, setOrders] = useState(initialOrders);
  const [cancelandoId, setCancelandoId] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => setOrders((prev) => [...prev]), 30_000);
    return () => clearInterval(interval);
  }, []);

  async function cancelarOrden(orderId: string) {
    const confirmado = window.confirm(
      "¿Cancelar esta orden? El inventario descontado se devolverá."
    );
    if (!confirmado) return;

    setCancelandoId(orderId);
    const { error } = await supabase.rpc("cancelar_orden", { orden_id: orderId });
    setCancelandoId(null);

    if (!error) {
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-neutral-900">
        Seguimiento de pedidos
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {orders.map((order) => {
          const transcurrido = Date.now() - new Date(order.created_at).getTime();
          const retrasada = order.status !== "lista" && transcurrido > TREINTA_MIN_MS;
          return (
            <div
              key={order.id}
              className={
                "rounded-xl p-4 border space-y-2 " +
                (retrasada
                  ? "bg-red-50 border-tomato"
                  : "bg-white border-neutral-200")
              }
            >
              <div className="flex justify-between items-center">
                <span className="font-medium text-neutral-900">
                  Orden #{order.id.slice(0, 6)}
                </span>
                {retrasada && (
                  <span className="text-xs text-tomato font-medium">
                    ⚠ +30 min sin entregar
                  </span>
                )}
              </div>
              <p className="text-sm text-neutral-500">Estado: {order.status}</p>
              <button
                onClick={() => cancelarOrden(order.id)}
                disabled={cancelandoId === order.id}
                className="w-full text-sm text-tomato border border-tomato/30 rounded-md py-2.5 hover:bg-tomato/5 disabled:opacity-50"
              >
                {cancelandoId === order.id ? "Cancelando..." : "Cancelar orden"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
