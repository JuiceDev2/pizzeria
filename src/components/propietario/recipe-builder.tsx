"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { recipeItemSchema, validar } from "@/lib/validation";
import type { Product, Flavor, Ingredient, ProductCategory } from "@/types/database";

type ProductRow = Pick<Product, "id" | "category" | "name" | "price" | "active">;
type FlavorRow = Pick<Flavor, "id" | "product_category" | "name" | "active">;
type IngredientRow = Pick<Ingredient, "id" | "name" | "stock_grams" | "min_threshold_grams">;

interface RecipeRow {
  id: string;
  ingredient_id: string;
  grams_used: number;
  ingredient_name: string;
}

// Categorías donde tiene sentido definir sabor (pizza/boneless/papas/bebida).
// "bebida" se incluye para poder cargar la receta de un agua fresca (que sí
// tiene sabor) o de un refresco simple (usando la opción "Base").
const CATEGORIAS_CON_SABOR: ProductCategory[] = ["pizza", "boneless", "papas", "bebida"];

export function RecipeBuilder({
  products,
  flavors,
  ingredients,
}: {
  products: ProductRow[];
  flavors: FlavorRow[];
  ingredients: IngredientRow[];
}) {
  const supabase = createClient();

  const [productId, setProductId] = useState<string>("");
  const [flavorId, setFlavorId] = useState<string>(""); // "" = sin sabor específico (base)
  const [recipeRows, setRecipeRows] = useState<RecipeRow[]>([]);
  const [loading, setLoading] = useState(false);

  const [newIngredientId, setNewIngredientId] = useState("");
  const [newGrams, setNewGrams] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedProduct = products.find((p) => p.id === productId) ?? null;
  const flavorsDelProducto = selectedProduct
    ? flavors.filter((f) => f.product_category === selectedProduct.category)
    : [];
  const requiereSabor =
    selectedProduct && CATEGORIAS_CON_SABOR.includes(selectedProduct.category);

  // Carga la receta SOLO del producto (+ sabor) seleccionado — nunca todas.
  useEffect(() => {
    if (!productId) {
      setRecipeRows([]);
      return;
    }

    let cancelado = false;
    setLoading(true);

    async function cargar() {
      let query = supabase
        .from("recipes")
        .select("id, ingredient_id, grams_used, ingredients(name)")
        .eq("product_id", productId);

      query = flavorId ? query.eq("flavor_id", flavorId) : query.is("flavor_id", null);

      const { data } = await query;
      if (cancelado) return;

      const rows: RecipeRow[] = (data ?? []).map((r: any) => ({
        id: r.id,
        ingredient_id: r.ingredient_id,
        grams_used: r.grams_used,
        ingredient_name: r.ingredients?.name ?? "—",
      }));
      setRecipeRows(rows);
      setLoading(false);
    }

    cargar();
    return () => {
      cancelado = true;
    };
  }, [productId, flavorId, supabase]);

  async function agregarIngrediente() {
    setError(null);
    if (!productId) return;

    const check = validar(recipeItemSchema, {
      ingredientId: newIngredientId,
      grams: Number(newGrams || 0),
    });
    if (!check.ok) {
      setError(check.error);
      return;
    }

    // Evita duplicar el mismo ingrediente en la misma receta
    if (recipeRows.some((r) => r.ingredient_id === check.data.ingredientId)) {
      setError("Ese ingrediente ya está en la receta. Elimínalo primero para cambiarlo.");
      return;
    }

    setSaving(true);
    const { data, error: insertError } = await supabase
      .from("recipes")
      .insert({
        product_id: productId,
        flavor_id: flavorId || null,
        ingredient_id: check.data.ingredientId,
        grams_used: check.data.grams,
      })
      .select("id, ingredient_id, grams_used")
      .single();
    setSaving(false);

    if (insertError) {
      setError("No se pudo guardar. Revisa que no exista ya esa combinación.");
      return;
    }

    const ingrediente = ingredients.find((i) => i.id === check.data.ingredientId);
    setRecipeRows((prev) => [
      ...prev,
      {
        id: data.id,
        ingredient_id: data.ingredient_id,
        grams_used: data.grams_used,
        ingredient_name: ingrediente?.name ?? "—",
      },
    ]);
    setNewIngredientId("");
    setNewGrams("");
  }

  async function eliminarFila(recipeId: string) {
    setRecipeRows((prev) => prev.filter((r) => r.id !== recipeId));
    await supabase.from("recipes").delete().eq("id", recipeId);
  }

  const totalGramos = recipeRows.reduce((sum, r) => sum + r.grams_used, 0);

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl border border-neutral-200 p-4 flex flex-wrap items-end gap-3">
        <div className="w-full sm:w-56">
          <label className="text-xs text-neutral-500">Producto</label>
          <select
            value={productId}
            onChange={(e) => {
              setProductId(e.target.value);
              setFlavorId("");
            }}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm mt-0.5"
          >
            <option value="">Selecciona un producto...</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {requiereSabor && (
          <div className="w-full sm:w-56">
            <label className="text-xs text-neutral-500">
              Sabor (opcional — vacío = ingredientes base)
            </label>
            <select
              value={flavorId}
              onChange={(e) => setFlavorId(e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm mt-0.5"
            >
              <option value="">Base (todos los sabores)</option>
              {flavorsDelProducto.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {!productId && (
        <p className="text-sm text-neutral-400 text-center py-8">
          Elige un producto para ver o editar su receta.
        </p>
      )}

      {productId && (
        <div className="bg-white rounded-xl border border-neutral-200 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-neutral-900">
              Receta: {selectedProduct?.name}
              {flavorId && (
                <span className="text-neutral-500 font-normal">
                  {" "}
                  — {flavorsDelProducto.find((f) => f.id === flavorId)?.name}
                </span>
              )}
            </h3>
            {recipeRows.length > 0 && (
              <span className="text-sm text-neutral-500">
                Total: {totalGramos} g
              </span>
            )}
          </div>

          {loading ? (
            <p className="text-sm text-neutral-400">Cargando receta...</p>
          ) : (
            <>
              {recipeRows.length === 0 && (
                <p className="text-sm text-neutral-400">
                  Sin ingredientes definidos todavía. Agrega el primero abajo.
                </p>
              )}
              <ul className="divide-y divide-neutral-100">
                {recipeRows.map((row) => (
                  <li
                    key={row.id}
                    className="flex items-center justify-between py-2 text-sm"
                  >
                    <span className="text-neutral-800">{row.ingredient_name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-neutral-500">{row.grams_used} g</span>
                      <button
                        onClick={() => eliminarFila(row.id)}
                        className="text-tomato hover:underline text-xs"
                      >
                        Quitar
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}

          {error && (
            <p className="text-sm text-tomato bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex flex-wrap items-end gap-3 pt-2 border-t border-neutral-100">
            <div className="w-full sm:flex-1 sm:min-w-[160px]">
              <label className="text-xs text-neutral-500">Agregar ingrediente</label>
              <select
                value={newIngredientId}
                onChange={(e) => setNewIngredientId(e.target.value)}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm mt-0.5"
              >
                <option value="">Selecciona...</option>
                {ingredients.map((ing) => (
                  <option key={ing.id} value={ing.id}>
                    {ing.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-[calc(50%-6px)] sm:w-28">
              <label className="text-xs text-neutral-500">Gramos</label>
              <input
                type="number"
                min="1"
                value={newGrams}
                onChange={(e) => setNewGrams(e.target.value)}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm mt-0.5"
              />
            </div>
            <button
              onClick={agregarIngrediente}
              disabled={saving || !newIngredientId || !newGrams}
              className="w-[calc(50%-6px)] sm:w-auto bg-crust text-white rounded-md px-4 py-2.5 sm:py-1.5 text-sm font-medium disabled:opacity-50"
            >
              {saving ? "Guardando..." : "+ Agregar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
