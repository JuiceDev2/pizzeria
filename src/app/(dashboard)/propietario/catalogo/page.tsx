import { createClient } from "@/lib/supabase/server";
import { CatalogoTabs } from "@/components/propietario/catalogo-tabs";

export default async function CatalogoPage() {
  const supabase = createClient();

  // Tres consultas ligeras y paralelas — cada una solo pide lo que muestra.
  const [{ data: ingredients }, { data: products }, { data: flavors }] =
    await Promise.all([
      supabase
        .from("ingredients")
        .select("id, name, stock_grams, min_threshold_grams")
        .order("name"),
      supabase
        .from("products")
        .select("id, category, name, price, active")
        .order("category")
        .order("name"),
      supabase
        .from("flavors")
        .select("id, product_category, name, active")
        .order("product_category")
        .order("name"),
    ]);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-neutral-900">Catálogo</h1>
      <CatalogoTabs
        initialIngredients={ingredients ?? []}
        initialProducts={products ?? []}
        initialFlavors={flavors ?? []}
      />
    </div>
  );
}
