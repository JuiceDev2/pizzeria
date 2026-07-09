import { createClient } from "@/lib/supabase/server";

export default async function HistorialCocinaPage() {
  const supabase = createClient();

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const { data: orders } = await supabase
    .from("orders")
    .select("id, status, created_at, updated_at")
    .in("status", ["lista", "entregada"])
    .gte("created_at", hoy.toISOString())
    .order("updated_at", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-neutral-100">
        Órdenes completadas hoy
      </h1>
      <div className="bg-neutral-800 rounded-xl border border-neutral-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-900 text-neutral-400 text-left">
            <tr>
              <th className="px-4 py-2 font-medium">Orden</th>
              <th className="px-4 py-2 font-medium">Recibida</th>
              <th className="px-4 py-2 font-medium">Completada</th>
              <th className="px-4 py-2 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-700">
            {(orders ?? []).map((o) => (
              <tr key={o.id}>
                <td className="px-4 py-2 text-neutral-200">
                  #{o.id.slice(0, 6)}
                </td>
                <td className="px-4 py-2 text-neutral-400">
                  {new Date(o.created_at).toLocaleTimeString("es-MX")}
                </td>
                <td className="px-4 py-2 text-neutral-400">
                  {new Date(o.updated_at).toLocaleTimeString("es-MX")}
                </td>
                <td className="px-4 py-2 text-basil">{o.status}</td>
              </tr>
            ))}
            {(orders ?? []).length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-neutral-500">
                  Aún no se ha completado ninguna orden hoy.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
