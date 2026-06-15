// Service worker disabled
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', () => {
  // Unregister self if activated
  self.registration.unregister();
});
