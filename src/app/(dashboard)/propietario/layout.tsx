import { requireRole } from "@/lib/auth";
import { NavBar } from "@/components/ui/nav-bar";
import { StockAlertListener } from "@/components/ui/stock-alert-listener";

export default async function PropietarioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireRole(["propietario"]);

  return (
    <div className="min-h-screen bg-neutral-50">
      <NavBar
        name={profile.name}
        role="Propietario"
        links={[
          { href: "/propietario", label: "Métricas" },
          { href: "/propietario/produccion", label: "Control de producción" },
          { href: "/propietario/catalogo", label: "Catálogo" },
          { href: "/propietario/historial", label: "Historial" },
          { href: "/propietario/tickets", label: "Tickets" },
          { href: "/propietario/usuarios", label: "Empleados" },
        ]}
      />
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
      <StockAlertListener />
    </div>
  );
}
