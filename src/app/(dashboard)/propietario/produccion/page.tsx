import { createClient } from "@/lib/supabase/server";
import type { IngredientStockRow } from "@/types/database";

interface Producible {
  product_id: string;
  product_name: string;
  flavor_id: string | null;
  flavor_name: string | null;
  cantidad_disponible: number;
}

export default async function ProduccionPage() {
  const supabase = createClient();

  const [{ data: ingredients }, { data: producibles }] = await Promise.all([
    supabase
      .from("ingredients")
      .select("id, name, stock_grams, min_threshold_grams")
      .order("name"),
    supabase.rpc("get_producibles"),
  ]);

  const rows = (ingredients ?? []) as IngredientStockRow[];
  const disponibles = (producibles ?? []) as Producible[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-900">
          Control de producción
        </h1>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 overflow-x-auto">
        <div className="bg-neutral-50 px-4 py-2 text-sm font-medium text-neutral-700">
          Piezas disponibles con el stock actual
        </div>
        <table className="w-full text-sm min-w-[420px]">
          <thead className="text-neutral-500 text-left border-b border-neutral-100">
            <tr>
              <th className="px-4 py-2 font-medium">Producto</th>
              <th className="px-4 py-2 font-medium">Sabor</th>
              <th className="px-4 py-2 font-medium">Piezas posibles</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {disponibles.map((d, i) => {
              const critico = d.cantidad_disponible <= 5;
              return (
                <tr key={i}>
                  <td className="px-4 py-2 text-neutral-900">{d.product_name}</td>
                  <td className="px-4 py-2 text-neutral-500">
                    {d.flavor_name ?? "—"}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={
                        critico ? "text-tomato font-medium" : "text-neutral-900"
                      }
                    >
                      {d.cantidad_disponible}
                    </span>
                  </td>
                </tr>
              );
            })}
            {disponibles.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-neutral-400">
                  Aún no hay recetas definidas. Ve a Catálogo → Recetas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 overflow-x-auto">
        <div className="bg-neutral-50 px-4 py-2 text-sm font-medium text-neutral-700">
          Stock de materias primas
        </div>
        <table className="w-full text-sm min-w-[420px]">
          <thead className="text-neutral-500 text-left border-b border-neutral-100">
            <tr>
              <th className="px-4 py-2 font-medium">Materia prima</th>
              <th className="px-4 py-2 font-medium">Stock (g)</th>
              <th className="px-4 py-2 font-medium">Umbral mínimo (g)</th>
              <th className="px-4 py-2 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {rows.map((ing) => {
              const escaso = ing.stock_grams < ing.min_threshold_grams;
              return (
                <tr key={ing.id}>
                  <td className="px-4 py-2 text-neutral-900">{ing.name}</td>
                  <td className="px-4 py-2">{ing.stock_grams.toLocaleString()}</td>
                  <td className="px-4 py-2 text-neutral-500">
                    {ing.min_threshold_grams.toLocaleString()}
                  </td>
                  <td className="px-4 py-2">
                    {escaso ? (
                      <span className="text-tomato font-medium">⚠ Escasez</span>
                    ) : (
                      <span className="text-basil">OK</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
