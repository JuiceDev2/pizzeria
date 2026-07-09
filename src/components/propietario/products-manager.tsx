"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { productSchema, validar } from "@/lib/validation";
import type { Product, ProductCategory } from "@/types/database";

type ProductRow = Pick<Product, "id" | "category" | "name" | "price" | "active">;

const CATEGORIAS: { key: ProductCategory; label: string }[] = [
  { key: "pizza", label: "Pizza" },
  { key: "boneless", label: "Boneles" },
  { key: "papas", label: "Papas" },
  { key: "bebida", label: "Bebida" },
];

export function ProductsManager({
  products,
  onChange,
}: {
  products: ProductRow[];
  onChange: (rows: ProductRow[]) => void;
}) {
  const supabase = createClient();
  const [category, setCategory] = useState<ProductCategory>("pizza");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function crearProducto(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const check = validar(productSchema, { name, price: Number(price || 0) });
    if (!check.ok) {
      setError(check.error);
      return;
    }

    setCreating(true);
    const { data, error: insertError } = await supabase
      .from("products")
      .insert({ category, name: check.data.name, price: check.data.price, active: true })
      .select("id, category, name, price, active")
      .single();
    setCreating(false);

    if (insertError) {
      setError("No se pudo crear el producto.");
      return;
    }

    onChange([...products, data as ProductRow]);
    setName("");
    setPrice("");
  }

  async function toggleActivo(product: ProductRow) {
    const { error: updateError } = await supabase
      .from("products")
      .update({ active: !product.active })
      .eq("id", product.id);

    if (!updateError) {
      onChange(
        products.map((p) =>
          p.id === product.id ? { ...p, active: !p.active } : p
        )
      );
    }
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={crearProducto}
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
          <label className="text-xs text-neutral-500">Nombre</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Pizza Grande, Coca-Cola 600ml..."
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm mt-0.5"
          />
        </div>
        <div className="w-[calc(50%-6px)] sm:w-28">
          <label className="text-xs text-neutral-500">Precio</label>
          <input
            type="number"
            min="0"
            step="0.5"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm mt-0.5"
          />
        </div>
        <button
          type="submit"
          disabled={creating}
          className="w-full sm:w-auto bg-crust text-white rounded-md px-4 py-2.5 sm:py-1.5 text-sm font-medium disabled:opacity-50"
        >
          {creating ? "Agregando..." : "Agregar producto"}
        </button>
      </form>

      {error && (
        <p className="text-sm text-tomato bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      {CATEGORIAS.map((cat) => {
        const items = products.filter((p) => p.category === cat.key);
        if (items.length === 0) return null;
        return (
          <div key={cat.key} className="bg-white rounded-xl border border-neutral-200 overflow-x-auto">
            <div className="bg-neutral-50 px-4 py-2 text-sm font-medium text-neutral-700">
              {cat.label}
            </div>
            <table className="w-full text-sm min-w-[360px]">
              <tbody className="divide-y divide-neutral-100">
                {items.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-2 text-neutral-900">{p.name}</td>
                    <td className="px-4 py-2 text-neutral-500">${p.price}</td>
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={() => toggleActivo(p)}
                        className={
                          "text-xs px-2.5 py-1 rounded-md " +
                          (p.active
                            ? "bg-basil/10 text-basil"
                            : "bg-neutral-100 text-neutral-400")
                        }
                      >
                        {p.active ? "Activo" : "Inactivo"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
