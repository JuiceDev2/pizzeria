"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { empleadoSchema, validar } from "@/lib/validation";
import type { Profile, UserRole } from "@/types/database";

type ProfileRow = Pick<Profile, "id" | "name" | "role" | "active" | "supervisor_id">;

const ROLES: { key: UserRole; label: string }[] = [
  { key: "propietario", label: "Propietario" },
  { key: "supervisor", label: "Supervisor" },
  { key: "cocina", label: "Cocina" },
  { key: "mesero", label: "Mesero" },
];

export function UsuariosManager({
  initialProfiles,
}: {
  initialProfiles: ProfileRow[];
}) {
  const supabase = createClient();
  const [profiles, setProfiles] = useState(initialProfiles);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("mesero");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supervisores = profiles.filter((p) => p.role === "supervisor" && p.active);

  async function crearEmpleado(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const check = validar(empleadoSchema, { name, email, password, role });
    if (!check.ok) {
      setError(check.error);
      return;
    }

    setCreating(true);
    const res = await fetch("/api/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(check.data),
    });
    const body = await res.json();
    setCreating(false);

    if (!res.ok) {
      setError(body.error ?? "No se pudo crear el empleado.");
      return;
    }

    setProfiles((prev) => [
      ...prev,
      { id: body.id, name: body.name, role: body.role, active: true, supervisor_id: null },
    ]);
    setName("");
    setEmail("");
    setPassword("");
  }

  async function toggleActivo(profile: ProfileRow) {
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ active: !profile.active })
      .eq("id", profile.id);

    if (!updateError) {
      setProfiles((prev) =>
        prev.map((p) => (p.id === profile.id ? { ...p, active: !p.active } : p))
      );
    }
  }

  async function asignarSupervisor(profileId: string, supervisorId: string) {
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ supervisor_id: supervisorId || null })
      .eq("id", profileId);

    if (!updateError) {
      setProfiles((prev) =>
        prev.map((p) =>
          p.id === profileId ? { ...p, supervisor_id: supervisorId || null } : p
        )
      );
    }
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={crearEmpleado}
        className="bg-white rounded-xl border border-neutral-200 p-4 flex flex-wrap items-end gap-3"
      >
        <div className="flex-1 min-w-[140px]">
          <label className="text-xs text-neutral-500">Nombre</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm mt-0.5"
          />
        </div>
        <div className="w-full sm:flex-1 sm:min-w-[160px]">
          <label className="text-xs text-neutral-500">Correo</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm mt-0.5"
          />
        </div>
        <div className="w-[calc(50%-6px)] sm:w-40">
          <label className="text-xs text-neutral-500">Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm mt-0.5"
          />
        </div>
        <div className="w-[calc(50%-6px)] sm:w-36">
          <label className="text-xs text-neutral-500">Rol</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm mt-0.5"
          >
            {ROLES.map((r) => (
              <option key={r.key} value={r.key}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={creating}
          className="w-full sm:w-auto bg-crust text-white rounded-md px-4 py-2.5 sm:py-1.5 text-sm font-medium disabled:opacity-50"
        >
          {creating ? "Creando..." : "Crear empleado"}
        </button>
      </form>

      {error && (
        <p className="text-sm text-tomato bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <div className="bg-white rounded-xl border border-neutral-200 overflow-x-auto">
        <table className="w-full text-sm min-w-[520px]">
          <thead className="bg-neutral-50 text-neutral-500 text-left">
            <tr>
              <th className="px-4 py-2 font-medium">Nombre</th>
              <th className="px-4 py-2 font-medium">Rol</th>
              <th className="px-4 py-2 font-medium">Supervisor asignado</th>
              <th className="px-4 py-2 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {profiles.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-2 text-neutral-900">{p.name}</td>
                <td className="px-4 py-2 text-neutral-500 capitalize">{p.role}</td>
                <td className="px-4 py-2">
                  {(p.role === "mesero" || p.role === "cocina") ? (
                    <select
                      value={p.supervisor_id ?? ""}
                      onChange={(e) => asignarSupervisor(p.id, e.target.value)}
                      className="rounded-md border border-neutral-300 px-2 py-1 text-xs"
                    >
                      <option value="">Sin asignar (todos ven)</option>
                      {supervisores.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-neutral-300">—</span>
                  )}
                </td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => toggleActivo(p)}
                    className={
                      "text-xs px-2.5 py-1 rounded-md " +
                      (p.active
                        ? "bg-basil/10 text-basil"
                        : "bg-neutral-100 text-neutral-400")
                    }
                  >
                    {p.active ? "Activo" : "Inactivo"}
                  </button>
                </td>
              </tr>
            ))}
            {profiles.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-neutral-400">
                  Aún no hay empleados registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-neutral-400">
        Un empleado "Inactivo" no puede iniciar sesión, aunque su cuenta y
        su historial de ventas se conservan.
      </p>
    </div>
  );
}
