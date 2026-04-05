const CACHE_VERSION = "v2"
const CACHE_PREFIX = "ctg-cache"
const SHELL_CACHE = `${CACHE_PREFIX}-shell-${CACHE_VERSION}`
const ASSET_CACHE = `${CACHE_PREFIX}-assets-${CACHE_VERSION}`
const APP_SHELL = ["./", "./index.html", "./manifest.webmanifest", "./vite.svg"]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(APP_SHELL))
  )
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith(CACHE_PREFIX))
            .filter((key) => key !== SHELL_CACHE && key !== ASSET_CACHE)
            .map((key) => caches.delete(key))
        )
      )
  )
  self.clients.claim()
})

async function networkFirstForNavigation(request) {
  try {
    const networkResponse = await fetch(request)

    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(SHELL_CACHE)
      await cache.put(request, networkResponse.clone())
      return networkResponse
    }
  } catch {
    // fallback to cache below
  }

  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    return cachedResponse
  }

  return caches.match("./index.html")
}

async function cacheFirstForAsset(request) {
  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    return cachedResponse
  }

  const networkResponse = await fetch(request)

  if (networkResponse && networkResponse.status === 200 && networkResponse.type === "basic") {
    const cache = await caches.open(ASSET_CACHE)
    await cache.put(request, networkResponse.clone())
  }

  return networkResponse
}

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

  const isNavigationRequest = request.mode === "navigate"
  const isHtmlRequest = request.headers.get("accept")?.includes("text/html")

  if (isNavigationRequest || isHtmlRequest) {
    event.respondWith(networkFirstForNavigation(request))
    return
  }

  event.respondWith(
    cacheFirstForAsset(request).catch(async () => {
      const cachedResponse = await caches.match(request)

      if (cachedResponse) {
        return cachedResponse
      }

      return caches.match("./index.html")
    })
  )
})
