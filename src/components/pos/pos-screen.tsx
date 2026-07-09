"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Product, Flavor, ProductCategory, PizzaStyle } from "@/types/database";

interface CartItem {
  product: Product;
  flavor?: Flavor;
  size?: string;
  style?: PizzaStyle;
  orilla_queso: boolean;
  qty: number;
}

interface Escaso {
  name: string;
  stock_grams: number;
}

const CATEGORIAS: { key: ProductCategory; label: string }[] = [
  { key: "pizza", label: "Pizza" },
  { key: "boneless", label: "Boneles" },
  { key: "papas", label: "Papas" },
  { key: "bebida", label: "Bebida" },
];

const TAMANOS = ["Chica", "Mediana", "Grande", "Familiar"];

export function PosScreen({
  products,
  flavors,
}: {
  products: Pick<Product, "id" | "category" | "name" | "price">[];
  flavors: Pick<Flavor, "id" | "product_category" | "name">[];
}) {
  const supabase = createClient();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [draft, setDraft] = useState<Partial<CartItem>>({});
  const [submitting, setSubmitting] = useState(false);
  const [escasos, setEscasos] = useState<Escaso[]>([]);
  // Solo importa en móvil: si el carrito está expandido en pantalla completa.
  const [cartOpenMobile, setCartOpenMobile] = useState(false);

  function openConfig(product: Product) {
    if (product.category === "bebida") {
      const saboresBebida = flavors.filter((f) => f.product_category === "bebida");
      if (saboresBebida.length === 0) {
        // Refresco simple: no hay nada que preguntar, se agrega directo.
        setCart((prev) => [...prev, { product, orilla_queso: false, qty: 1 }]);
        return;
      }
    }
    setActiveProduct(product);
    setDraft({ product, orilla_queso: false, qty: 1 });
  }

  function confirmItem() {
    if (!activeProduct) return;
    setCart((prev) => [
      ...prev,
      {
        product: activeProduct,
        flavor: draft.flavor,
        size: draft.size,
        style: draft.style,
        orilla_queso: draft.orilla_queso ?? false,
        qty: draft.qty ?? 1,
      },
    ]);
    setActiveProduct(null);
    setDraft({});
  }

  const total = cart.reduce((sum, item) => sum + item.product.price * item.qty, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);

  async function enviarOrden() {
    if (cart.length === 0) return;
    setSubmitting(true);
    setEscasos([]);

    // Llama a una función RPC transaccional que crea la orden + items,
    // descuenta inventario, y devuelve qué ingredientes quedaron escasos.
    const { data, error } = await supabase.rpc("crear_orden", {
      items: cart.map((item) => ({
        product_id: item.product.id,
        flavor_id: item.flavor?.id ?? null,
        size: item.size ?? null,
        style: item.style ?? null,
        orilla_queso: item.orilla_queso,
        price: item.product.price,
        qty: item.qty,
      })),
    });

    setSubmitting(false);
    if (!error && data) {
      setCart([]);
      setCartOpenMobile(false);
      const nuevosEscasos =
        (data as { escasos?: Escaso[] }).escasos ?? [];
      if (nuevosEscasos.length > 0) {
        setEscasos(nuevosEscasos);
      }
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Espacio extra abajo en móvil para que la barra fija no tape el último producto */}
      <div className="lg:col-span-2 space-y-6 pb-24 lg:pb-0">
        {CATEGORIAS.map((cat) => {
          const items = products.filter((p) => p.category === cat.key);
          if (items.length === 0) return null;
          return (
            <div key={cat.key}>
              <h2 className="text-sm font-medium text-neutral-500 mb-2">
                {cat.label}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {items.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => openConfig(p as Product)}
                    className="bg-white border border-neutral-200 rounded-xl p-4 text-left hover:border-crust active:scale-[0.98] transition min-h-[76px]"
                  >
                    <p className="font-medium text-neutral-900">{p.name}</p>
                    <p className="text-sm text-neutral-500">${p.price}</p>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Carrito: panel lateral fijo en pantallas grandes (lg+) */}
      <div className="hidden lg:block bg-white rounded-xl border border-neutral-200 p-4 h-fit space-y-3">
        <CartContents
          cart={cart}
          total={total}
          escasos={escasos}
          submitting={submitting}
          onSend={enviarOrden}
        />
      </div>

      {/* Barra fija inferior, solo en móvil/tablet — resume la orden y abre el detalle */}
      {cart.length > 0 && !cartOpenMobile && (
        <button
          onClick={() => setCartOpenMobile(true)}
          className="lg:hidden fixed bottom-0 left-0 right-0 bg-crust text-white px-4 py-4 flex items-center justify-between shadow-[0_-4px_12px_rgba(0,0,0,0.15)] z-40"
        >
          <span className="text-sm font-medium">
            {totalItems} {totalItems === 1 ? "producto" : "productos"} · ${total}
          </span>
          <span className="text-sm font-medium">Ver orden ▲</span>
        </button>
      )}

      {/* Drawer de pantalla completa en móvil, con el contenido del carrito */}
      {cartOpenMobile && (
        <div className="lg:hidden fixed inset-0 bg-black/40 z-50 flex items-end">
          <div className="bg-white rounded-t-2xl w-full max-h-[85vh] overflow-y-auto p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-medium text-neutral-900">Orden actual</h2>
              <button
                onClick={() => setCartOpenMobile(false)}
                className="text-neutral-400 text-sm"
              >
                Cerrar
              </button>
            </div>
            <CartContents
              cart={cart}
              total={total}
              escasos={escasos}
              submitting={submitting}
              onSend={enviarOrden}
            />
          </div>
        </div>
      )}

      {activeProduct && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 sm:px-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl p-6 w-full sm:max-w-sm max-h-[90vh] overflow-y-auto space-y-4">
            <h3 className="font-medium text-neutral-900">{activeProduct.name}</h3>

            {activeProduct.category === "pizza" && (
              <>
                <FlavorPicker
                  flavors={flavors.filter((f) => f.product_category === "pizza")}
                  selected={draft.flavor}
                  onSelect={(f) => setDraft((d) => ({ ...d, flavor: f as Flavor }))}
                />
                <SizePicker
                  selected={draft.size}
                  onSelect={(s) => setDraft((d) => ({ ...d, size: s }))}
                />
                <div className="flex gap-2">
                  {(["normal", "dorada"] as PizzaStyle[]).map((style) => (
                    <button
                      key={style}
                      onClick={() => setDraft((d) => ({ ...d, style }))}
                      className={
                        "flex-1 rounded-md py-2 text-sm border " +
                        (draft.style === style
                          ? "bg-crust text-white border-crust"
                          : "border-neutral-300 text-neutral-700")
                      }
                    >
                      {style === "normal" ? "Normal" : "Dorada"}
                    </button>
                  ))}
                </div>
                <label className="flex items-center gap-2 text-sm text-neutral-700 py-1">
                  <input
                    type="checkbox"
                    checked={draft.orilla_queso ?? false}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, orilla_queso: e.target.checked }))
                    }
                    className="w-4 h-4"
                  />
                  Orilla de queso
                </label>
              </>
            )}

            {activeProduct.category === "boneless" && (
              <FlavorPicker
                flavors={flavors.filter((f) => f.product_category === "boneless")}
                selected={draft.flavor}
                onSelect={(f) => setDraft((d) => ({ ...d, flavor: f as Flavor }))}
              />
            )}

            {activeProduct.category === "papas" && (
              <FlavorPicker
                flavors={flavors.filter((f) => f.product_category === "papas")}
                selected={draft.flavor}
                onSelect={(f) => setDraft((d) => ({ ...d, flavor: f as Flavor }))}
              />
            )}

            {activeProduct.category === "bebida" && (
              <FlavorPicker
                flavors={flavors.filter((f) => f.product_category === "bebida")}
                selected={draft.flavor}
                onSelect={(f) => setDraft((d) => ({ ...d, flavor: f as Flavor }))}
              />
            )}

            <div className="flex gap-2 pt-2 sticky bottom-0 bg-white">
              <button
                onClick={() => setActiveProduct(null)}
                className="flex-1 border border-neutral-300 rounded-md py-2.5 text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={confirmItem}
                className="flex-1 bg-crust text-white rounded-md py-2.5 text-sm"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CartContents({
  cart,
  total,
  escasos,
  submitting,
  onSend,
}: {
  cart: CartItem[];
  total: number;
  escasos: Escaso[];
  submitting: boolean;
  onSend: () => void;
}) {
  return (
    <>
      {cart.length === 0 && (
        <p className="text-sm text-neutral-400">Aún no hay productos.</p>
      )}
      <ul className="space-y-2 text-sm">
        {cart.map((item, i) => (
          <li key={i} className="flex justify-between text-neutral-700">
            <span>
              {item.qty}x {item.product.name}
              {item.flavor ? ` (${item.flavor.name})` : ""}
              {item.size ? ` - ${item.size}` : ""}
            </span>
            <span>${item.product.price * item.qty}</span>
          </li>
        ))}
      </ul>
      <div className="border-t border-neutral-100 pt-3 flex justify-between font-medium text-neutral-900">
        <span>Total</span>
        <span>${total}</span>
      </div>
      <button
        onClick={onSend}
        disabled={cart.length === 0 || submitting}
        className="w-full bg-crust text-white rounded-md py-3 lg:py-2 text-sm font-medium disabled:opacity-40"
      >
        {submitting ? "Enviando..." : "Enviar a cocina"}
      </button>

      {escasos.length > 0 && (
        <div className="bg-red-50 border border-tomato/30 rounded-md p-3 space-y-1">
          <p className="text-xs font-medium text-tomato">
            ⚠ Esta venta dejó ingredientes escasos:
          </p>
          <ul className="text-xs text-tomato/90">
            {escasos.map((e, i) => (
              <li key={i}>
                {e.name}: {(e.stock_grams / 1000).toFixed(2)} kg restantes
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

function FlavorPicker({
  flavors,
  selected,
  onSelect,
}: {
  flavors: Pick<Flavor, "id" | "product_category" | "name">[];
  selected?: Flavor;
  onSelect: (f: Pick<Flavor, "id" | "product_category" | "name">) => void;
}) {
  return (
    <div>
      <p className="text-xs text-neutral-500 mb-1.5">Sabor</p>
      <div className="flex flex-wrap gap-2">
        {flavors.map((f) => (
          <button
            key={f.id}
            onClick={() => onSelect(f)}
            className={
              "px-3 py-2 rounded-md text-sm border " +
              (selected?.id === f.id
                ? "bg-crust text-white border-crust"
                : "border-neutral-300 text-neutral-700")
            }
          >
            {f.name}
          </button>
        ))}
      </div>
    </div>
  );
}

function SizePicker({
  selected,
  onSelect,
}: {
  selected?: string;
  onSelect: (s: string) => void;
}) {
  return (
    <div>
      <p className="text-xs text-neutral-500 mb-1.5">Tamaño</p>
      <div className="flex flex-wrap gap-2">
        {TAMANOS.map((s) => (
          <button
            key={s}
            onClick={() => onSelect(s)}
            className={
              "px-3 py-2 rounded-md text-sm border " +
              (selected === s
                ? "bg-crust text-white border-crust"
                : "border-neutral-300 text-neutral-700")
            }
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
