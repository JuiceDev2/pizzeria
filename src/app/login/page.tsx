"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError || !data.user) {
      setError("Correo o contraseña incorrectos.");
      setLoading(false);
      return;
    }

    // Pedimos 'role' y 'active', nada más.
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, active")
      .eq("id", data.user.id)
      .single();

    if (!profile) {
      setLoading(false);
      setError("No se encontró tu perfil. Contacta al propietario.");
      return;
    }

    if (!profile.active) {
      await supabase.auth.signOut();
      setLoading(false);
      setError("Tu cuenta está desactivada. Contacta al propietario.");
      return;
    }

    setLoading(false);
    router.push(`/${profile.role}`);
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white rounded-xl shadow-sm border border-neutral-200 p-8 space-y-5"
      >
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-semibold text-neutral-900">Pizzería</h1>
          <p className="text-sm text-neutral-500">Inicia sesión para continuar</p>
        </div>

        {error && (
          <div className="text-sm text-tomato bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        <div className="space-y-1">
          <label className="text-sm font-medium text-neutral-700">Correo</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-crust"
            placeholder="tucorreo@pizzeria.com"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-neutral-700">Contraseña</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-crust"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-crust text-white rounded-md py-2 text-sm font-medium hover:bg-crust/90 disabled:opacity-50 transition"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
