import { requireRole } from "@/lib/auth";
import { NavBar } from "@/components/ui/nav-bar";

export default async function MeseroLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireRole(["mesero", "supervisor", "propietario"]);

  return (
    <div className="min-h-screen bg-neutral-50">
      <NavBar
        name={profile.name}
        role="Mesero"
        links={[{ href: "/mesero", label: "Nueva orden" }]}
      />
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
