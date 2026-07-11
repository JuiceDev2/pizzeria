// Tipos que reflejan el esquema real de Supabase.
// Mantenlos sincronizados con supabase/migrations/*.sql
// (a futuro puedes generarlos automáticamente con `supabase gen types typescript`)

export type UserRole = "propietario" | "supervisor" | "cocina" | "mesero";

export type ProductCategory = "pizza" | "boneless" | "papas" | "bebida";

export type OrderStatus = "pendiente" | "lista" | "entregada" | "cancelada";

export type PizzaStyle = "normal" | "dorada";

export interface Profile {
  id: string;
  name: string;
  role: UserRole;
  active: boolean;
  supervisor_id: string | null;
  created_at: string;
}

export interface Ingredient {
  id: string;
  name: string;
  stock_grams: number;
  min_threshold_grams: number;
  updated_at: string;
}

export interface Product {
  id: string;
  category: ProductCategory;
  name: string;
  price: number;
  active: boolean;
}

export interface Flavor {
  id: string;
  product_category: ProductCategory;
  name: string;
  active: boolean;
}

export interface Recipe {
  id: string;
  product_id: string;
  flavor_id: string | null;
  ingredient_id: string;
  grams_used: number;
}

export interface Order {
  id: string;
  mesero_id: string;
  status: OrderStatus;
  total: number;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  flavor_id: string | null;
  size: string | null;
  style: PizzaStyle | null;
  orilla_queso: boolean;
  price: number;
  qty: number;
}

// --- Vistas / proyecciones ligeras usadas en el front ---
// Selecciona SOLO estas columnas en Supabase, nunca "*"

export type OrderCardData = Pick<
  Order,
  "id" | "status" | "created_at" | "total"
> & {
  order_items: (Pick<
    OrderItem,
    "id" | "qty" | "size" | "style" | "orilla_queso"
  > & {
    products: Pick<Product, "name">[];
    flavors: Pick<Flavor, "name">[];
  })[];
};

export type IngredientStockRow = Pick<
  Ingredient,
  "id" | "name" | "stock_grams" | "min_threshold_grams"
>;
