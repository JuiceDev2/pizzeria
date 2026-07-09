import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente con la service_role key. Bypasea RLS por completo.
 * NUNCA importar esto en un "use client" ni exponerlo al navegador.
 * Solo se usa dentro de Route Handlers (src/app/api/**) para operaciones
 * administrativas como crear usuarios de Auth.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
