const CACHE = 'fly-time-v4'
const APP_SHELL = ['/manifest.webmanifest', '/icon.svg']

const getSameOriginAssets = (html) => [...html.matchAll(/(?:src|href)=["']([^"']+)["']/g)].flatMap((match) => {
  try {
    const url = new URL(match[1], self.location.origin)
    return url.origin === self.location.origin ? [url.pathname] : []
  } catch {
    return []
  }
})

const precacheApp = async () => {
  const cache = await caches.open(CACHE)
  const page = await fetch('/', { cache: 'no-store' })
  if (!page.ok) throw new Error(`Unable to precache app shell: ${page.status}`)
  await cache.put('/', page.clone())
  const html = await page.text()
  const assets = [...new Set([...APP_SHELL, ...getSameOriginAssets(html)])]
  await Promise.all(assets.map(async (asset) => {
    try {
      const response = await fetch(asset, { cache: 'no-store' })
      if (response.ok) await cache.put(asset, response)
    } catch {
      // A single optional asset should not prevent the PWA from installing.
    }
  }))
}

self.addEventListener('install', (event) => {
  event.waitUntil(precacheApp())
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)),
    )).then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).then((response) => {
        if (response.ok) {
          const copy = response.clone()
          caches.open(CACHE).then((cache) => cache.put('/', copy))
        }
        return response
      }).catch(() => caches.match('/', { ignoreSearch: true })),
    )
    return
  }
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
      if (response.ok && new URL(event.request.url).origin === self.location.origin) {
        const copy = response.clone()
        caches.open(CACHE).then((cache) => cache.put(event.request, copy))
      }
      return response
    }).catch(() => event.request.mode === 'navigate' ? caches.match('/') : Response.error()))
  )
})
