import { requireRole } from "@/lib/auth";
import { NavBar } from "@/components/ui/nav-bar";
import { StockAlertListener } from "@/components/ui/stock-alert-listener";

export default async function SupervisorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireRole(["supervisor", "propietario"]);

  return (
    <div className="min-h-screen bg-neutral-50">
      <NavBar
        name={profile.name}
        role="Supervisor"
        links={[
          { href: "/supervisor", label: "Seguimiento de pedidos" },
          { href: "/cocina", label: "Ver cocina" },
          { href: "/supervisor/tickets", label: "Tickets" },
        ]}
      />
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
      <StockAlertListener />
    </div>
  );
}
