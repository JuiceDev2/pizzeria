"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    // Se registra después de que la página cargó para no competir
    // por ancho de banda con el primer render.
    const registrar = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Si falla el registro (ej. navegador sin soporte), la app
        // sigue funcionando normal, solo sin capacidades offline.
      });
    };

    if (document.readyState === "complete") {
      registrar();
    } else {
      window.addEventListener("load", registrar);
      return () => window.removeEventListener("load", registrar);
    }
  }, []);

  return null;
}
