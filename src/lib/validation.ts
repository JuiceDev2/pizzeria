import { z } from "zod";

// Esquemas centralizados de validación. Cada formulario del catálogo y de
// empleados usa uno de estos antes de tocar Supabase — así los mensajes de
// error son consistentes y las reglas de negocio viven en un solo lugar.

export const ingredientSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(60, "El nombre es demasiado largo"),
  stockKg: z
    .number({ invalid_type_error: "Ingresa un número válido" })
    .min(0, "El stock no puede ser negativo")
    .max(100000, "Esa cantidad parece un error de captura"),
  thresholdKg: z
    .number({ invalid_type_error: "Ingresa un número válido" })
    .min(0, "El umbral no puede ser negativo"),
});

export const purchaseSchema = z.object({
  kg: z
    .number({ invalid_type_error: "Ingresa un número válido" })
    .positive("La cantidad debe ser mayor a 0")
    .max(10000, "Esa cantidad parece un error de captura"),
});

export const productSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(60, "El nombre es demasiado largo"),
  price: z
    .number({ invalid_type_error: "Ingresa un precio válido" })
    .positive("El precio debe ser mayor a 0")
    .max(100000, "Ese precio parece un error de captura"),
});

export const flavorSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(60, "El nombre es demasiado largo"),
});

export const recipeItemSchema = z.object({
  ingredientId: z.string().uuid("Selecciona un ingrediente válido"),
  grams: z
    .number({ invalid_type_error: "Ingresa los gramos" })
    .positive("Los gramos deben ser mayor a 0")
    .max(50000, "Esa cantidad de gramos parece un error de captura"),
});

export const empleadoSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(80, "El nombre es demasiado largo"),
  email: z.string().trim().email("Correo inválido"),
  password: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres")
    .max(72, "La contraseña es demasiado larga"),
  role: z.enum(["propietario", "supervisor", "cocina", "mesero"], {
    errorMap: () => ({ message: "Selecciona un rol válido" }),
  }),
});

/**
 * Ejecuta un schema y devuelve { ok, data, error } en vez de lanzar,
 * para que los componentes de formulario solo tengan que revisar `ok`.
 */
export function validar<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { ok: true; data: T } | { ok: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { ok: true, data: result.data };
  }
  const primerError = result.error.issues[0];
  return { ok: false, error: primerError?.message ?? "Datos inválidos" };
}
