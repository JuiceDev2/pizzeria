"use client";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="w-full bg-crust text-white rounded-lg py-2.5 text-sm font-medium hover:bg-crust/90 transition"
    >
      🖨️ Imprimir / Guardar PDF
    </button>
  );
}
