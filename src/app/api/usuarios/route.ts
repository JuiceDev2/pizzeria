import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { empleadoSchema, validar } from "@/lib/validation";

export async function POST(request: Request) {
  const supabase = createClient();

  // Verifica que quien llama sea el propietario autenticado.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { data: caller } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (caller?.role !== "propietario") {
    return NextResponse.json(
      { error: "Solo el propietario puede crear empleados" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const check = validar(empleadoSchema, body);

  if (!check.ok) {
    return NextResponse.json({ error: check.error }, { status: 400 });
  }

  const { name, email, password, role } = check.data;

  const admin = createAdminClient();

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError || !created.user) {
    return NextResponse.json(
      { error: createError?.message ?? "No se pudo crear el usuario" },
      { status: 400 }
    );
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: created.user.id,
    name,
    role,
    active: true,
  });

  if (profileError) {
    // Si falla el perfil, no dejamos un usuario de Auth huérfano.
    await admin.auth.admin.deleteUser(created.user.id);
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  return NextResponse.json({
    id: created.user.id,
    name,
    role,
    active: true,
  });
}
