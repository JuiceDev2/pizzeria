"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { flavorSchema, validar } from "@/lib/validation";
import type { Flavor, ProductCategory } from "@/types/database";

type FlavorRow = Pick<Flavor, "id" | "product_category" | "name" | "active">;

// Categorías donde puede haber sabor. "bebida" se incluye porque un agua
// fresca sí tiene sabor (fresa, horchata, etc.), aunque un refresco simple
// puede quedarse sin ninguno definido.
const CATEGORIAS: { key: ProductCategory; label: string }[] = [
  { key: "pizza", label: "Pizza" },
  { key: "boneless", label: "Boneles" },
  { key: "papas", label: "Papas" },
  { key: "bebida", label: "Bebida" },
];

export function FlavorsManager({
  flavors,
  onChange,
}: {
  flavors: FlavorRow[];
  onChange: (rows: FlavorRow[]) => void;
}) {
  const supabase = createClient();
  const [category, setCategory] = useState<ProductCategory>("pizza");
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function crearSabor(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const check = validar(flavorSchema, { name });
    if (!check.ok) {
      setError(check.error);
      return;
    }

    setCreating(true);
    const { data, error: insertError } = await supabase
      .from("flavors")
      .insert({ product_category: category, name: check.data.name, active: true })
      .select("id, product_category, name, active")
      .single();
    setCreating(false);

    if (insertError) {
      setError("No se pudo crear el sabor.");
      return;
    }

    onChange([...flavors, data as FlavorRow]);
    setName("");
  }

  async function toggleActivo(flavor: FlavorRow) {
    const { error: updateError } = await supabase
      .from("flavors")
      .update({ active: !flavor.active })
      .eq("id", flavor.id);

    if (!updateError) {
      onChange(
        flavors.map((f) =>
          f.id === flavor.id ? { ...f, active: !f.active } : f
        )
      );
    }
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={crearSabor}
        className="bg-white rounded-xl border border-neutral-200 p-4 flex flex-wrap items-end gap-3"
      >
        <div className="w-[calc(50%-6px)] sm:w-40">
          <label className="text-xs text-neutral-500">Categoría</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ProductCategory)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm mt-0.5"
          >
            {CATEGORIAS.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div className="w-full sm:flex-1 sm:min-w-[160px]">
          <label className="text-xs text-neutral-500">Sabor</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Hawaiana, Pepperoni, Carnes frías..."
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm mt-0.5"
          />
        </div>
        <button
          type="submit"
          disabled={creating}
          className="w-full sm:w-auto bg-crust text-white rounded-md px-4 py-2.5 sm:py-1.5 text-sm font-medium disabled:opacity-50"
        >
          {creating ? "Agregando..." : "Agregar sabor"}
        </button>
      </form>

      {error && (
        <p className="text-sm text-tomato bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      {CATEGORIAS.map((cat) => {
        const items = flavors.filter((f) => f.product_category === cat.key);
        if (items.length === 0) return null;
        return (
          <div key={cat.key} className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
            <div className="bg-neutral-50 px-4 py-2 text-sm font-medium text-neutral-700">
              {cat.label}
            </div>
            <div className="flex flex-wrap gap-2 p-4">
              {items.map((f) => (
                <button
                  key={f.id}
                  onClick={() => toggleActivo(f)}
                  className={
                    "text-sm px-3 py-1.5 rounded-md border " +
                    (f.active
                      ? "border-basil/30 bg-basil/10 text-basil"
                      : "border-neutral-200 bg-neutral-50 text-neutral-400")
                  }
                >
                  {f.name}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
