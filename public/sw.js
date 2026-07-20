// Service Worker：負責 (1) 離線快取 (2) 接收並顯示推播通知
// 快取策略說明：
//   - HTML（頁面本身）採「網路優先」：每次都先抓最新版，抓不到才用快取。
//     這很重要——因為每次重新部署後 JS/CSS 檔名都會改變，如果 HTML 用舊快取，
//     會指向已不存在的舊檔案而導致整頁空白。
//   - 其他資源（JS/CSS/圖示/資料 JSON）採「網路優先 + 成功後寫入快取」，
//     離線時才退回快取版本。

const CACHE_NAME = "stock-watch-cache-v2"; // 改版時把版本號 +1，舊快取會自動清除

self.addEventListener("install", (event) => {
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
    fetch(event.request)
      .then((response) => {
        // 抓成功：更新快取，供離線時使用
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
        }
        return response;
      })
      .catch(() =>
        // 離線或抓失敗：退回快取
        caches.match(event.request).then((cached) => {
          if (cached) return cached;
          // 導航請求連快取都沒有時，退回首頁快取
          if (event.request.mode === "navigate") return caches.match("./index.html");
          return Response.error();
        })
      )
  );
});

// 收到推播訊息時顯示通知
self.addEventListener("push", (event) => {
  let payload = { title: "股市監測助手", body: "有新的股票動態，點我查看", data: { url: "./" } };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch (e) {
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
