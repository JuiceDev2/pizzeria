import { createClient } from "@/lib/supabase/server";
import { KitchenBoard } from "@/components/cocina/kitchen-board";
import type { OrderCardData } from "@/types/database";

export default async function CocinaPage() {
  const supabase = createClient();

  // Solo órdenes pendientes de preparar (las "lista"/"entregada" viven en
  // /cocina/historial, no aquí).
  const { data: orders } = await supabase
    .from("orders")
    .select(
      "id, status, created_at, total, order_items(id, qty, size, style, orilla_queso, products(name), flavors(name))"
    )
    .eq("status", "pendiente")
    .order("created_at", { ascending: true });

  return <KitchenBoard initialOrders={(orders ?? []) as OrderCardData[]} />;
}
