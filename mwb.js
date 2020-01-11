importScripts('https://storage.googleapis.com/workbox-cdn/releases/4.3.1/workbox-sw.js');

const 
  cachename = 'mapworkbox',
  expconfig ={
    maxEntries: 250,
    maxAgeSeconds: 120
  },
  pruner = new workbox.expiration.Plugin(expconfig),
  precacheController = new workbox.precaching.PrecacheController(cachename);
  
self.addEventListener('activate', (event) => {
  event.waitUntil(precacheController.activate());
});

self.addEventListener('message', (event) => {
  if (event.data.type === 'CACHE_URLS') {    
    const tocache = event.data.payload.urlsToCache;
    precacheController.addToCacheList(tocache);
    precacheController.install({
      plugins: [pruner]
    });
  }  
});