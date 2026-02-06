// Smart Student Dashboard - Service Worker
// Version 1.0.7 - Fixed for new folder structure

const CACHE_NAME = 'student-hub-v1.0.7';
const BASE_PATH = '/student-hubv2'; // GitHub Pages subdirectory

const urlsToCache = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/index.html`,
  `${BASE_PATH}/css/styles.css`,
  `${BASE_PATH}/js/app.js`,
  `${BASE_PATH}/manifest.json`,
  `${BASE_PATH}/icons/icon-72x72.png`,
  `${BASE_PATH}/icons/icon-96x96.png`,
  `${BASE_PATH}/icons/icon-128x128.png`,
  `${BASE_PATH}/icons/icon-144x144.png`,
  `${BASE_PATH}/icons/icon-152x152.png`,
  `${BASE_PATH}/icons/icon-192x192.png`,
  `${BASE_PATH}/icons/icon-384x384.png`,
  `${BASE_PATH}/icons/icon-512x512.png`,
  'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/fonts/bootstrap-icons.woff2'
];

// Install Service Worker
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching app shell and assets');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[Service Worker] Installed successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[Service Worker] Install failed:', error);
      })
  );
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[Service Worker] Activated successfully');
        return self.clients.claim();
      })
  );
});

// Fetch Strategy: Network First, falling back to Cache
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin) && 
      !event.request.url.includes('cdn.jsdelivr.net')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Check if valid response
        if (!response || response.status !== 200) {
          return response;
        }

        // Clone the response
        const responseToCache = response.clone();

        caches.open(CACHE_NAME)
          .then((cache) => {
            cache.put(event.request, responseToCache);
          });

        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(event.request)
          .then((response) => {
            if (response) {
              console.log('[Service Worker] Serving from cache:', event.request.url);
              return response;
            }
            
            // Return the main page as fallback
            return caches.match(`${BASE_PATH}/index.html`);
          });
      })
  );
});

// Handle messages from the client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Background Sync (for future online features)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    console.log('[Service Worker] Background sync triggered');
    event.waitUntil(syncData());
  }
});

async function syncData() {
  // Placeholder for future sync functionality
  console.log('[Service Worker] Syncing data...');
  return Promise.resolve();
}

// Push Notifications (for future features)
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'New update available',
    icon: `${BASE_PATH}/icons/icon-192x192.png`,
    badge: `${BASE_PATH}/icons/icon-72x72.png`,
    vibrate: [200, 100, 200],
    tag: 'student-hub-notification',
    requireInteraction: false
  };

  event.waitUntil(
    self.registration.showNotification('Student Hub', options)
  );
});

// Notification Click Handler
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked');
  event.notification.close();

  event.waitUntil(
    clients.openWindow(BASE_PATH)
  );
});
