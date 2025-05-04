// Service Worker for Prayer Times App

const CACHE_NAME = 'prayer-times-cache-v1';
const URLS_TO_CACHE = [
    '/',
    '/index.html',
    '/icons/prayer-icon.svg',
    '/icons/badge-icon.svg'
];

// Service Worker Kurulumu
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Cache opened');
                return cache.addAll(URLS_TO_CACHE);
            })
    );
});

// Service Worker Aktivasyonu
self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Fetch olayı dinleme
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Cache'ten yanıt döndür
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});

// Push bildirimi al
self.addEventListener('push', (event) => {
    if (event.data) {
        const notificationData = event.data.json();
        const options = {
            body: notificationData.body,
            icon: notificationData.icon || '/icons/prayer-icon.svg',
            badge: notificationData.badge || '/icons/badge-icon.svg',
            tag: notificationData.tag || 'prayer-notification',
            data: notificationData.data || {},
            requireInteraction: true
        };

        event.waitUntil(
            self.registration.showNotification(notificationData.title, options)
        );
    }
});

// Bildirime tıklama
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const urlToOpen = new URL('/', self.location.origin).href;

    // Pencereyi açma
    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then((windowClients) => {
            // Açık bir pencere var mı kontrol et
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    return client.focus();
                }
            }
            // Yoksa yeni pencere aç
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
}); 