import { createClient } from "@/lib/supabase/server";
import { PosScreen } from "@/components/pos/pos-screen";

export default async function MeseroPage() {
  const supabase = createClient();

  const [{ data: products }, { data: flavors }] = await Promise.all([
    supabase
      .from("products")
      .select("id, category, name, price")
      .eq("active", true),
    supabase
      .from("flavors")
      .select("id, product_category, name")
      .eq("active", true),
  ]);

  return (
    <PosScreen products={products ?? []} flavors={flavors ?? []} />
  );
}
