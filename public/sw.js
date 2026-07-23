// OVERCLOCK Service Worker — cache-first app shell
// Version bump this string to force a cache refresh on all clients.
const CACHE = 'oc-v1'

const SHELL = [
  '/',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
]

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(SHELL))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return

  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached

      return fetch(e.request)
        .then((res) => {
          if (!res || res.status !== 200 || res.type === 'opaque') return res
          const clone = res.clone()
          caches.open(CACHE).then((c) => c.put(e.request, clone))
          return res
        })
        .catch(() => {
          // Navigation fallback — serve the app shell for any navigate miss
          // so the app loads offline even when navigating to a deep path.
          if (e.request.mode === 'navigate') return caches.match('/')
        })
    }),
  )
})
