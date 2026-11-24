// Service Worker for Hanzi4U Web Push Notifications & Study Reminders
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = {
    title: 'Hanzi4U - Nhắc lịch học tiếng Trung',
    body: 'Đã đến giờ học tiếng Trung theo lịch của bạn. Dành 15 phút ôn bài hôm nay nhé!',
    icon: '/images/logo.png',
    badge: '/favicon.ico',
    tag: 'hanzi4u-study-reminder',
    data: { url: '/#/today' },
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/images/logo.png',
    badge: data.badge || '/favicon.ico',
    tag: data.tag || 'hanzi4u-study-reminder',
    renotify: true,
    data: data.data || { url: '/#/today' },
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/#/today';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url && 'focus' in client) {
          if ('navigate' in client) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
