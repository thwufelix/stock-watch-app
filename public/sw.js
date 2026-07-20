// Service Worker：負責 (1) 基本離線快取 (2) 接收並顯示推播通知
// 這個檔案會被部署到網站根目錄，瀏覽器會在背景執行它，即使 App 沒開著也能收到通知。

const CACHE_NAME = "stock-watch-cache-v1";
const CORE_ASSETS = ["./", "./index.html", "./manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).catch(() => cached))
  );
});

// 收到推播訊息時顯示通知
self.addEventListener("push", (event) => {
  let payload = { title: "股市監測助手", body: "有新的股票動態，點我查看", data: { url: "./" } };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch (e) {
    // 若推播內容不是 JSON，就用純文字當內文
    if (event.data) payload.body = event.data.text();
  }

  const options = {
    body: payload.body,
    icon: "./icons/icon-192.png",
    badge: "./icons/icon-192.png",
    data: payload.data || { url: "./" },
    tag: payload.tag || "stock-watch-update",
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

// 點擊通知時開啟或聚焦到 App
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "./";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && "focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});
