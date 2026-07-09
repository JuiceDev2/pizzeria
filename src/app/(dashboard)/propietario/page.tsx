import { createClient } from "@/lib/supabase/server";
import { VentasChart } from "@/components/propietario/ventas-chart";
import { TopProductosChart } from "@/components/propietario/top-productos-chart";

export default async function MetricasPage() {
  const supabase = createClient();

  // Tres RPCs en paralelo. Cada una ya devuelve datos agregados
  // (pocas filas), nunca las órdenes crudas.
  const [{ data: ventasHoy }, { data: productosTop }, { data: ventasPorDia }] =
    await Promise.all([
      supabase.rpc("get_ventas_hoy"),
      supabase.rpc("get_productos_top", { limite: 5 }),
      supabase.rpc("get_ventas_por_dia", { dias: 7 }),
    ]);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-neutral-900">Métricas</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <p className="text-sm text-neutral-500">Ventas de hoy</p>
          <p className="text-2xl font-semibold text-crust mt-1">
            ${ventasHoy?.[0]?.total ?? 0}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <p className="text-sm text-neutral-500">Órdenes hoy</p>
          <p className="text-2xl font-semibold text-crust mt-1">
            {ventasHoy?.[0]?.ordenes ?? 0}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <p className="text-sm text-neutral-500">Ticket promedio</p>
          <p className="text-2xl font-semibold text-crust mt-1">
            ${ventasHoy?.[0]?.ticket_promedio ?? 0}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <h2 className="font-medium text-neutral-900 mb-3">
            Ventas — últimos 7 días
          </h2>
          <VentasChart data={ventasPorDia ?? []} />
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <h2 className="font-medium text-neutral-900 mb-3">Productos estrella</h2>
          <TopProductosChart data={productosTop ?? []} />
        </div>
      </div>
    </div>
  );
}
