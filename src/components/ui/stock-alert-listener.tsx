"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface StockAlert {
  id: string;
  name: string;
  stock_grams: number;
}

/**
 * Se suscribe a cambios en 'ingredients' y muestra un toast cuando algún
 * ingrediente cruza (de arriba hacia abajo) su umbral mínimo. No hace polling:
 * reacciona al evento UPDATE que ya dispara crear_orden() al vender.
 */
export function StockAlertListener() {
  const supabase = createClient();
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const yaAlertados = useRef<Set<string>>(new Set());

  useEffect(() => {
    const channel = supabase
      .channel("stock-alerts")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "ingredients" },
        (payload) => {
          const row = payload.new as {
            id: string;
            name: string;
            stock_grams: number;
            min_threshold_grams: number;
          };

          if (row.stock_grams < row.min_threshold_grams) {
            if (!yaAlertados.current.has(row.id)) {
              yaAlertados.current.add(row.id);
              setAlerts((prev) => [
                ...prev,
                { id: row.id, name: row.name, stock_grams: row.stock_grams },
              ]);
              setTimeout(() => {
                setAlerts((prev) => prev.filter((a) => a.id !== row.id));
              }, 9000);
            }
          } else {
            // Si se reabasteció por encima del umbral, permite alertar de nuevo
            // la próxima vez que baje.
            yaAlertados.current.delete(row.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  if (alerts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 space-y-2 z-50 max-w-xs">
      {alerts.map((a) => (
        <div
          key={a.id}
          className="bg-tomato text-white rounded-lg shadow-lg px-4 py-3 text-sm"
        >
          ⚠ Escasez de <strong>{a.name}</strong>: quedan{" "}
          {(a.stock_grams / 1000).toFixed(2)} kg
        </div>
      ))}
    </div>
  );
}
