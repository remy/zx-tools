// we'll version our cache (and learn how to delete caches in
// some other post)
const cacheName = 'v1::static';

self.addEventListener('install', (e) => {
  // once the SW is installed, go ahead and fetch the resources
  // to make this work offline
  e.waitUntil(
    caches.open(cacheName).then((cache) => {
      return cache
        .addAll([
          '/index.html',
          '/index.css',
          '/favicon.ico',
          '/bas/index.html',
          '/bas/codemirror.scss',
          '/bas/index.css',
          '/lib/cm.js',
          '/bas/index.js',
          '/help/index.html',
          '/help/index.css',
          '/sprites/index.html',
          '/sprites/index.css',
          '/sprites/index.js',
          '/tools/index.html',
          '/tools/index.css',
          '/tools/index.js',
        ])
        .then(() => self.skipWaiting());
    })
  );
});

// when the browser fetches a url, either response with
// the cached object or go ahead and fetch the actual url
self.addEventListener('fetch', (event) => {
  let req = event.request;
  let url = new URL(req.url);

  if (!url.origin.includes('__localhost') && url.pathname.endsWith('/')) {
    url.pathname += 'index.html';
    req = url;
  }

  event.respondWith(
    // ensure we check the *right* cache to match against
    caches.open(cacheName).then((cache) => {
      return cache.match(req).then((res) => {
        return res || fetch(event.request);
      });
    })
  );
});
