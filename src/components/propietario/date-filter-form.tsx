"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function DateFilterForm({
  desde,
  hasta,
}: {
  desde: string;
  hasta: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [desdeInput, setDesdeInput] = useState(desde);
  const [hastaInput, setHastaInput] = useState(hasta);

  function aplicarFiltro(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    params.set("desde", desdeInput);
    params.set("hasta", hastaInput);
    params.set("page", "1");
    router.push(`/propietario/historial?${params.toString()}`);
  }

  function setRangoRapido(dias: number) {
    const hoy = new Date();
    const inicio = new Date();
    inicio.setDate(hoy.getDate() - (dias - 1));

    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    setDesdeInput(fmt(inicio));
    setHastaInput(fmt(hoy));

    const params = new URLSearchParams(searchParams.toString());
    params.set("desde", fmt(inicio));
    params.set("hasta", fmt(hoy));
    params.set("page", "1");
    router.push(`/propietario/historial?${params.toString()}`);
  }

  return (
    <form
      onSubmit={aplicarFiltro}
      className="bg-white rounded-xl border border-neutral-200 p-4 flex flex-wrap items-end gap-3"
    >
      <div className="w-[calc(50%-6px)] sm:w-40">
        <label className="text-xs text-neutral-500">Desde</label>
        <input
          type="date"
          value={desdeInput}
          onChange={(e) => setDesdeInput(e.target.value)}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm mt-0.5"
        />
      </div>
      <div className="w-[calc(50%-6px)] sm:w-40">
        <label className="text-xs text-neutral-500">Hasta</label>
        <input
          type="date"
          value={hastaInput}
          onChange={(e) => setHastaInput(e.target.value)}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm mt-0.5"
        />
      </div>
      <button
        type="submit"
        className="w-full sm:w-auto bg-crust text-white rounded-md px-4 py-2.5 sm:py-1.5 text-sm font-medium"
      >
        Filtrar
      </button>

      <div className="flex gap-2 w-full sm:w-auto sm:ml-auto">
        <button
          type="button"
          onClick={() => setRangoRapido(1)}
          className="flex-1 sm:flex-none text-xs px-3 py-2 sm:py-1.5 rounded-md border border-neutral-300 text-neutral-600 hover:bg-neutral-50"
        >
          Hoy
        </button>
        <button
          type="button"
          onClick={() => setRangoRapido(7)}
          className="flex-1 sm:flex-none text-xs px-3 py-2 sm:py-1.5 rounded-md border border-neutral-300 text-neutral-600 hover:bg-neutral-50"
        >
          7 días
        </button>
        <button
          type="button"
          onClick={() => setRangoRapido(30)}
          className="flex-1 sm:flex-none text-xs px-3 py-2 sm:py-1.5 rounded-md border border-neutral-300 text-neutral-600 hover:bg-neutral-50"
        >
          30 días
        </button>
      </div>
    </form>
  );
}
