import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Corre en todas las rutas excepto:
     * - _next/static, _next/image (assets internos de Next)
     * - archivos PWA públicos (manifest, service worker, offline, íconos)
     * - archivos estáticos comunes (svg, png, jpg, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|offline.html|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
