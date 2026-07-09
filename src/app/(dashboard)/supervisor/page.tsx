import { createClient } from "@/lib/supabase/server";
import { getProfileOrRedirect } from "@/lib/auth";
import { SupervisorBoard } from "@/components/pos/supervisor-board";
import type { OrderCardData } from "@/types/database";

export default async function SupervisorPage() {
  const supabase = createClient();
  const profile = await getProfileOrRedirect();

  // El propietario ve todo; un supervisor solo ve a sus meseros asignados
  // + los que no tienen supervisor asignado (pool sin dueño).
  let meserosVisibles: string[] | null = null;

  if (profile.role === "supervisor") {
    const { data: meseros } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "mesero")
      .or(`supervisor_id.eq.${profile.id},supervisor_id.is.null`);

    meserosVisibles = (meseros ?? []).map((m) => m.id);
  }

  let query = supabase
    .from("orders")
    .select("id, status, created_at, total")
    .in("status", ["pendiente", "lista"])
    .order("created_at", { ascending: true });

  if (meserosVisibles) {
    query = query.in("mesero_id", meserosVisibles);
  }

  const { data: orders } = await query;

  return <SupervisorBoard initialOrders={(orders ?? []) as OrderCardData[]} />;
}
