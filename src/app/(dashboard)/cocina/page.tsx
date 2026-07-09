import { createClient } from "@/lib/supabase/server";
import { KitchenBoard } from "@/components/cocina/kitchen-board";
import type { OrderCardData } from "@/types/database";

export default async function CocinaPage() {
  const supabase = createClient();

  // Solo órdenes activas, solo columnas necesarias.
  const { data: orders } = await supabase
    .from("orders")
    .select(
      "id, status, created_at, total, order_items(id, qty, size, style, orilla_queso)"
    )
    .in("status", ["pendiente", "lista"])
    .order("created_at", { ascending: true });

  return <KitchenBoard initialOrders={(orders ?? []) as OrderCardData[]} />;
}
