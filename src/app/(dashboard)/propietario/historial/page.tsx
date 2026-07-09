import { createClient } from "@/lib/supabase/server";
import { DateFilterForm } from "@/components/propietario/date-filter-form";
import { OrderRow } from "@/components/propietario/order-row";

const PAGE_SIZE = 20;

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

function haceDiasISO(dias: number) {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return d.toISOString().slice(0, 10);
}

export default async function HistorialPage({
  searchParams,
}: {
  searchParams: { desde?: string; hasta?: string; page?: string };
}) {
  const desde = searchParams.desde ?? haceDiasISO(6);
  const hasta = searchParams.hasta ?? hoyISO();
  const page = Math.max(1, Number(searchParams.page ?? "1"));
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = createClient();

  // Resumen agregado (una función SQL, no se suma en el cliente)
  // + página de órdenes, en paralelo.
  const [{ data: resumen }, { data: orders, count }] = await Promise.all([
    supabase.rpc("get_ventas_rango", { desde, hasta }),
    supabase
      .from("orders")
      .select("id, status, total, created_at", { count: "exact" })
      .gte("created_at", desde)
      .lt("created_at", `${hasta}T23:59:59`)
      .order("created_at", { ascending: false })
      .range(from, to),
  ]);

  const totalPages = count ? Math.ceil(count / PAGE_SIZE) : 1;

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold text-neutral-900">
        Historial de ventas
      </h1>

      <DateFilterForm desde={desde} hasta={hasta} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <p className="text-sm text-neutral-500">Total del rango</p>
          <p className="text-xl font-semibold text-crust mt-1">
            ${resumen?.[0]?.total ?? 0}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <p className="text-sm text-neutral-500">Órdenes</p>
          <p className="text-xl font-semibold text-crust mt-1">
            {resumen?.[0]?.ordenes ?? 0}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <p className="text-sm text-neutral-500">Ticket promedio</p>
          <p className="text-xl font-semibold text-crust mt-1">
            ${resumen?.[0]?.ticket_promedio ?? 0}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 overflow-x-auto">
        <table className="w-full text-sm min-w-[480px]">
          <thead className="bg-neutral-50 text-neutral-500 text-left">
            <tr>
              <th className="px-4 py-2 font-medium">Fecha</th>
              <th className="px-4 py-2 font-medium">Estado</th>
              <th className="px-4 py-2 font-medium">Total</th>
              <th className="px-4 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {(orders ?? []).map((o) => (
              <OrderRow
                key={o.id}
                id={o.id}
                status={o.status}
                total={o.total}
                createdAt={o.created_at}
              />
            ))}
            {(orders ?? []).length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-neutral-400">
                  No hay ventas en este rango de fechas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <a
              key={n}
              href={`/propietario/historial?desde=${desde}&hasta=${hasta}&page=${n}`}
              className={
                "px-3.5 py-2 rounded-md " +
                (n === page
                  ? "bg-crust text-white"
                  : "border border-neutral-300 text-neutral-600 hover:bg-neutral-50")
              }
            >
              {n}
            </a>
          ))}
        </div>
      )}

      <p className="text-xs text-neutral-400">
        Toca una fila para ver qué productos incluyó cada orden.
      </p>
    </div>
  );
}
