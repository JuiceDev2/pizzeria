"use client";

import { useState } from "react";
import type { Ingredient, Product, Flavor } from "@/types/database";
import { IngredientsManager } from "./ingredients-manager";
import { ProductsManager } from "./products-manager";
import { FlavorsManager } from "./flavors-manager";
import { RecipeBuilder } from "./recipe-builder";

type Tab = "ingredientes" | "productos" | "sabores" | "recetas";

const TABS: { key: Tab; label: string }[] = [
  { key: "ingredientes", label: "Ingredientes" },
  { key: "productos", label: "Productos" },
  { key: "sabores", label: "Sabores" },
  { key: "recetas", label: "Recetas" },
];

export function CatalogoTabs({
  initialIngredients,
  initialProducts,
  initialFlavors,
}: {
  initialIngredients: Pick<Ingredient, "id" | "name" | "stock_grams" | "min_threshold_grams">[];
  initialProducts: Pick<Product, "id" | "category" | "name" | "price" | "active">[];
  initialFlavors: Pick<Flavor, "id" | "product_category" | "name" | "active">[];
}) {
  const [tab, setTab] = useState<Tab>("ingredientes");
  const [ingredients, setIngredients] = useState(initialIngredients);
  const [products, setProducts] = useState(initialProducts);
  const [flavors, setFlavors] = useState(initialFlavors);

  return (
    <div className="space-y-5">
      <div className="flex gap-1 border-b border-neutral-200 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition whitespace-nowrap " +
              (tab === t.key
                ? "border-crust text-crust"
                : "border-transparent text-neutral-500 hover:text-neutral-900")
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "ingredientes" && (
        <IngredientsManager ingredients={ingredients} onChange={setIngredients} />
      )}

      {tab === "productos" && (
        <ProductsManager products={products} onChange={setProducts} />
      )}

      {tab === "sabores" && (
        <FlavorsManager flavors={flavors} onChange={setFlavors} />
      )}

      {tab === "recetas" && (
        <RecipeBuilder products={products} flavors={flavors} ingredients={ingredients} />
      )}
    </div>
  );
}
