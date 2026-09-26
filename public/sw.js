const CACHE_NAME = "ekayana-shell-v2";
const SHELL_ASSETS = [
  "/",
  "/index.html",
  "/css/styles.css",
  "/js/app.js",
  "/js/books.js",
  "/manifest.webmanifest",
  "/assets/icon.svg",
  // The full text of all three books ships with the app and is cached
  // on install, so every text is available offline from the very first
  // launch — not just the one the person happens to open first.
  "/data/gita.json",
  "/data/quran.json",
  "/data/bible.json",
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Cache-first for our own shell assets; network-first (with cache fallback)
// for everything else, so the app still opens without a connection.
self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET") return;

  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        const network = fetch(event.request)
          .then(res => {
            if (res && res.ok) {
              const clone = res.clone();
              caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
            }
            return res;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
  }
});
