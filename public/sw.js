// Service worker de la Pizzería.
// Estrategia simple y segura para una app que depende de datos en vivo
// (Supabase): SOLO cachea assets estáticos propios (JS/CSS/íconos de
// _next y /icons). Todo lo demás (páginas, llamadas a Supabase, API
// routes) va siempre a la red — así nunca se sirve una orden o un
// stock desactualizado desde caché.

const CACHE_NAME = "pizzeria-static-v1";
const OFFLINE_URL = "/offline.html";

const PRECACHE_URLS = [OFFLINE_URL, "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

function esAssetEstatico(url) {
  return (
    url.origin === self.location.origin &&
    (url.pathname.startsWith("/_next/static/") ||
      url.pathname.startsWith("/icons/") ||
      url.pathname === "/manifest.json")
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return; // nunca interceptar POST/PATCH/etc.

  const url = new URL(request.url);

  // Assets estáticos propios: cache-first (son inmutables por build hash).
  if (esAssetEstatico(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        });
      })
    );
    return;
  }

  // Navegación (páginas HTML): siempre red primero, con fallback offline
  // si no hay conexión. Nunca servimos una página de cocina/pos vieja.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  // Todo lo demás (Supabase, API routes, etc.) pasa directo a la red.
});
