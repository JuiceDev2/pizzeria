"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface NavLink {
  href: string;
  label: string;
}

interface NavBarProps {
  name: string;
  role: string;
  links: NavLink[];
  dark?: boolean;
}

export function NavBar({ name, role, links, dark = false }: NavBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const baseClasses = dark
    ? "bg-neutral-900 border-b border-neutral-800 text-neutral-100"
    : "bg-white border-b border-neutral-200 text-neutral-900";

  return (
    <nav className={baseClasses}>
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="font-semibold">🍕 {role}</span>
          {/* Links completos solo en pantallas medianas en adelante */}
          <div className="hidden lg:flex items-center gap-4 text-sm">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={
                  pathname === link.href
                    ? "font-medium text-crust"
                    : dark
                    ? "text-neutral-400 hover:text-neutral-100"
                    : "text-neutral-500 hover:text-neutral-900"
                }
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Nombre + salir, visibles siempre */}
        <div className="hidden lg:flex items-center gap-3 text-sm">
          <span className={dark ? "text-neutral-400" : "text-neutral-500"}>
            {name}
          </span>
          <button
            onClick={handleLogout}
            className="text-neutral-500 hover:text-tomato transition"
          >
            Salir
          </button>
        </div>

        {/* Botón hamburguesa, solo en móvil */}
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="lg:hidden p-2 -mr-2"
          aria-label="Abrir menú"
        >
          <div className="w-5 flex flex-col gap-1">
            <span
              className={
                "block h-0.5 w-full transition " +
                (dark ? "bg-neutral-100" : "bg-neutral-900") +
                (menuOpen ? " translate-y-1.5 rotate-45" : "")
              }
            />
            <span
              className={
                "block h-0.5 w-full transition " +
                (dark ? "bg-neutral-100" : "bg-neutral-900") +
                (menuOpen ? " opacity-0" : "")
              }
            />
            <span
              className={
                "block h-0.5 w-full transition " +
                (dark ? "bg-neutral-100" : "bg-neutral-900") +
                (menuOpen ? " -translate-y-1.5 -rotate-45" : "")
              }
            />
          </div>
        </button>
      </div>

      {/* Panel desplegable en móvil */}
      {menuOpen && (
        <div
          className={
            "lg:hidden border-t px-4 py-3 space-y-3 " +
            (dark ? "border-neutral-800" : "border-neutral-200")
          }
        >
          <div className="flex flex-col gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={
                  "py-2 text-sm rounded-md px-2 " +
                  (pathname === link.href
                    ? "font-medium text-crust bg-crust/5"
                    : dark
                    ? "text-neutral-300"
                    : "text-neutral-600")
                }
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div
            className={
              "flex items-center justify-between pt-2 border-t text-sm " +
              (dark ? "border-neutral-800" : "border-neutral-200")
            }
          >
            <span className={dark ? "text-neutral-400" : "text-neutral-500"}>
              {name}
            </span>
            <button onClick={handleLogout} className="text-tomato font-medium">
              Salir
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
