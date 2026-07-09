import { createClient } from "@/lib/supabase/server";
import { UsuariosManager } from "@/components/propietario/usuarios-manager";

export default async function UsuariosPage() {
  const supabase = createClient();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name, role, active, supervisor_id")
    .order("role")
    .order("name");

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-neutral-900">Empleados</h1>
      <UsuariosManager initialProfiles={profiles ?? []} />
    </div>
  );
}
