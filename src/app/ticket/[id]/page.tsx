import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/ticket/print-button";

interface TicketItem {
  qty: number;
  producto: string;
  sabor: string | null;
  size: string | null;
  style: string | null;
  orilla_queso: boolean;
  price: number;
}

interface TicketData {
  id: string;
  folio: string;
  status: string;
  total: number;
  created_at: string;
  mesero: string;
  items: TicketItem[];
}

const ESTADO_LABEL: Record<string, string> = {
  pendiente: "Pendiente",
  lista: "Lista",
  entregada: "Entregada",
  cancelada: "Cancelada",
};

export default async function TicketPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data } = await supabase.rpc("get_ticket_publico", {
    p_orden_id: params.id,
  });

  const ticket = data as unknown as TicketData | null;

  if (!ticket) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-neutral-100 py-8 px-4 print:bg-white print:py-0">
      <div className="max-w-sm mx-auto bg-white rounded-xl border border-neutral-200 shadow-sm print:shadow-none print:border-0 overflow-hidden">
        <div className="bg-crust text-white text-center py-5 px-4">
          <p className="text-2xl">🍕</p>
          <h1 className="font-semibold text-lg mt-1">Pizzería</h1>
          <p className="text-xs text-white/70 mt-0.5">Ticket #{ticket.folio}</p>
        </div>

        <div className="p-5 space-y-4 text-sm">
          <div className="flex justify-between text-neutral-500">
            <span>
              {new Date(ticket.created_at).toLocaleString("es-MX", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </span>
            <span className="font-medium text-crust">
              {ESTADO_LABEL[ticket.status] ?? ticket.status}
            </span>
          </div>

          <p className="text-neutral-500">
            Atendió: <span className="text-neutral-800">{ticket.mesero}</span>
          </p>

          <div className="border-t border-dashed border-neutral-300 pt-3">
            <ul className="space-y-2">
              {ticket.items.map((item, i) => (
                <li key={i} className="flex justify-between gap-3">
                  <span className="text-neutral-700">
                    {item.qty}x {item.producto}
                    {item.sabor ? ` (${item.sabor})` : ""}
                    {item.size ? ` - ${item.size}` : ""}
                    {item.style ? ` ${item.style}` : ""}
                    {item.orilla_queso ? " + orilla de queso" : ""}
                  </span>
                  <span className="text-neutral-500 whitespace-nowrap">
                    ${(item.price * item.qty).toFixed(2)}
                  </span>
                </li>
              ))}
              {ticket.items.length === 0 && (
                <li className="text-neutral-400">Sin productos registrados.</li>
              )}
            </ul>
          </div>

          <div className="border-t border-dashed border-neutral-300 pt-3 flex justify-between items-center">
            <span className="font-medium text-neutral-800">Total</span>
            <span className="font-semibold text-lg text-crust">
              ${ticket.total.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="px-5 pb-5 print:hidden">
          <PrintButton />
        </div>

        <p className="text-center text-[11px] text-neutral-400 pb-4 print:hidden">
          Ticket generado automáticamente · #{ticket.id}
        </p>
      </div>
    </div>
  );
}
