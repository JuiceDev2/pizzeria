"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ingredientSchema, purchaseSchema, validar } from "@/lib/validation";
import type { Ingredient } from "@/types/database";

type IngredientRow = Pick<
  Ingredient,
  "id" | "name" | "stock_grams" | "min_threshold_grams"
>;

export function IngredientsManager({
  ingredients,
  onChange,
}: {
  ingredients: IngredientRow[];
  onChange: (rows: IngredientRow[]) => void;
}) {
  const supabase = createClient();

  // Alta de nuevo ingrediente
  const [newName, setNewName] = useState("");
  const [newStockKg, setNewStockKg] = useState("");
  const [newThresholdKg, setNewThresholdKg] = useState("");
  const [creating, setCreating] = useState(false);

  // Compra (sumar kg) por ingrediente
  const [purchaseKg, setPurchaseKg] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function crearIngrediente(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const check = validar(ingredientSchema, {
      name: newName,
      stockKg: Number(newStockKg || 0),
      thresholdKg: Number(newThresholdKg || 0),
    });
    if (!check.ok) {
      setError(check.error);
      return;
    }

    setCreating(true);
    const { data, error: insertError } = await supabase
      .from("ingredients")
      .insert({
        name: check.data.name,
        stock_grams: check.data.stockKg * 1000,
        min_threshold_grams: check.data.thresholdKg * 1000,
      })
      .select("id, name, stock_grams, min_threshold_grams")
      .single();
    setCreating(false);

    if (insertError) {
      setError("No se pudo crear el ingrediente. ¿Ya existe ese nombre?");
      return;
    }

    onChange([...ingredients, data as IngredientRow].sort((a, b) => a.name.localeCompare(b.name)));
    setNewName("");
    setNewStockKg("");
    setNewThresholdKg("");
  }

  async function agregarCompra(ingredientId: string, stockActual: number) {
    setError(null);
    const check = validar(purchaseSchema, { kg: Number(purchaseKg[ingredientId]) });
    if (!check.ok) {
      setError(check.error);
      return;
    }

    setSavingId(ingredientId);
    const nuevoStock = stockActual + check.data.kg * 1000;

    const { error: updateError } = await supabase
      .from("ingredients")
      .update({ stock_grams: nuevoStock, updated_at: new Date().toISOString() })
      .eq("id", ingredientId);

    setSavingId(null);

    if (!updateError) {
      onChange(
        ingredients.map((ing) =>
          ing.id === ingredientId ? { ...ing, stock_grams: nuevoStock } : ing
        )
      );
      setPurchaseKg((prev) => ({ ...prev, [ingredientId]: "" }));
    }
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={crearIngrediente}
        className="bg-white rounded-xl border border-neutral-200 p-4 flex flex-wrap items-end gap-3"
      >
        <div className="w-full sm:flex-1 sm:min-w-[160px]">
          <label className="text-xs text-neutral-500">Nombre</label>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Pepperoni, Masa, Queso mozzarella..."
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm mt-0.5"
          />
        </div>
        <div className="w-[calc(50%-6px)] sm:w-32">
          <label className="text-xs text-neutral-500">Stock inicial (kg)</label>
          <input
            type="number"
            min="0"
            step="0.1"
            value={newStockKg}
            onChange={(e) => setNewStockKg(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm mt-0.5"
          />
        </div>
        <div className="w-[calc(50%-6px)] sm:w-32">
          <label className="text-xs text-neutral-500">Umbral mínimo (kg)</label>
          <input
            type="number"
            min="0"
            step="0.1"
            value={newThresholdKg}
            onChange={(e) => setNewThresholdKg(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm mt-0.5"
          />
        </div>
        <button
          type="submit"
          disabled={creating}
          className="w-full sm:w-auto bg-crust text-white rounded-md px-4 py-2.5 sm:py-1.5 text-sm font-medium disabled:opacity-50"
        >
          {creating ? "Agregando..." : "Agregar ingrediente"}
        </button>
      </form>

      {error && (
        <p className="text-sm text-tomato bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <div className="bg-white rounded-xl border border-neutral-200 overflow-x-auto">
        <table className="w-full text-sm min-w-[560px]">
          <thead className="bg-neutral-50 text-neutral-500 text-left">
            <tr>
              <th className="px-4 py-2 font-medium">Materia prima</th>
              <th className="px-4 py-2 font-medium">Stock actual</th>
              <th className="px-4 py-2 font-medium">Umbral mínimo</th>
              <th className="px-4 py-2 font-medium">Estado</th>
              <th className="px-4 py-2 font-medium">Registrar compra</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {ingredients.map((ing) => {
              const escaso = ing.stock_grams < ing.min_threshold_grams;
              return (
                <tr key={ing.id}>
                  <td className="px-4 py-2 text-neutral-900">{ing.name}</td>
                  <td className="px-4 py-2">
                    {(ing.stock_grams / 1000).toLocaleString()} kg
                  </td>
                  <td className="px-4 py-2 text-neutral-500">
                    {(ing.min_threshold_grams / 1000).toLocaleString()} kg
                  </td>
                  <td className="px-4 py-2">
                    {escaso ? (
                      <span className="text-tomato font-medium">⚠ Escasez</span>
                    ) : (
                      <span className="text-basil">OK</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        placeholder="kg"
                        value={purchaseKg[ing.id] ?? ""}
                        onChange={(e) =>
                          setPurchaseKg((prev) => ({
                            ...prev,
                            [ing.id]: e.target.value,
                          }))
                        }
                        className="w-20 rounded-md border border-neutral-300 px-2 py-1 text-sm"
                      />
                      <button
                        onClick={() => agregarCompra(ing.id, ing.stock_grams)}
                        disabled={savingId === ing.id}
                        className="text-xs bg-basil text-white rounded-md px-2.5 py-1 disabled:opacity-50"
                      >
                        {savingId === ing.id ? "..." : "+ Sumar"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {ingredients.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-neutral-400">
                  Aún no hay ingredientes registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
