import { createClient } from "@/lib/supabase/server";
import { getProfileOrRedirect } from "@/lib/auth";
import { TicketsList, type TicketListItem } from "@/components/ticket/tickets-list";

export default async function MeseroTicketsPage() {
  const profile = await getProfileOrRedirect();
  const supabase = createClient();

  const { data: orders } = await supabase
    .from("orders")
    .select("id, created_at, total, status")
    .eq("mesero_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const items: TicketListItem[] = (orders ?? []).map((o: any) => ({
    id: o.id,
    created_at: o.created_at,
    total: o.total,
    status: o.status,
  }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Tickets</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Comparte cualquiera de tus órdenes por WhatsApp — se abre en un
          link que cualquiera puede ver, sin necesidad de iniciar sesión.
        </p>
      </div>
      <TicketsList orders={items} />
    </div>
  );
}
