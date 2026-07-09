import { requireRole } from "@/lib/auth";
import { NavBar } from "@/components/ui/nav-bar";

export default async function CocinaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireRole(["cocina", "supervisor", "propietario"]);

  return (
    <div className="min-h-screen bg-neutral-900">
      <NavBar
        name={profile.name}
        role="Cocina"
        links={[
          { href: "/cocina", label: "Órdenes" },
          { href: "/cocina/historial", label: "Historial de hoy" },
        ]}
        dark
      />
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
