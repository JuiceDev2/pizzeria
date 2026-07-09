import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/types/database";

/**
 * Obtiene el perfil (con rol) del usuario autenticado.
 * Selecciona solo las columnas necesarias — nunca "*".
 * Si no hay sesión, redirige a /login.
 */
export async function getProfileOrRedirect(): Promise<Profile> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, name, role, active, supervisor_id, created_at")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    redirect("/login");
  }

  return profile as Profile;
}

/**
 * Exige que el usuario tenga uno de los roles permitidos.
 * Úsalo al inicio de cada layout de (dashboard)/<rol>/layout.tsx
 */
export async function requireRole(allowed: UserRole[]): Promise<Profile> {
  const profile = await getProfileOrRedirect();

  if (!allowed.includes(profile.role)) {
    redirect(`/${profile.role}`);
  }

  return profile;
}
