const CACHE_NAME = "ctg-cache-v1"
const APP_SHELL = ["./", "./index.html", "./manifest.webmanifest", "./vite.svg"]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  )
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  )
  self.clients.claim()
})

self.addEventListener("fetch", (event) => {
  const { request } = event

  if (request.method !== "GET") {
    return
  }

  const requestUrl = new URL(request.url)
  const sameOrigin = requestUrl.origin === self.location.origin

  if (!sameOrigin) {
    return
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse
      }

      return fetch(request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== "basic") {
            return networkResponse
          }

          const responseClone = networkResponse.clone()
          void caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone))

          return networkResponse
        })
        .catch(() => caches.match("./index.html"))
    })
  )
})
