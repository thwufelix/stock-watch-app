// src/utils/dataClient.js
// 統一從 public/data/ 讀取由 GitHub Actions 排程產生的最新資料，
// 並自動處理部署到子路徑（如 GitHub Pages）時的網址前綴。

export async function loadDashboard() {
  const res = await fetch(`${import.meta.env.BASE_URL}data/dashboard.json?_=${Date.now()}`);
  if (!res.ok) throw new Error("讀取儀表板資料失敗");
  return res.json();
}

export async function loadPriceHistory() {
  const res = await fetch(`${import.meta.env.BASE_URL}data/price_history.json?_=${Date.now()}`);
  if (!res.ok) throw new Error("讀取價格歷史資料失敗");
  return res.json();
}

export async function loadNotificationHistory() {
  const res = await fetch(`${import.meta.env.BASE_URL}data/notification_history.json?_=${Date.now()}`);
  if (!res.ok) throw new Error("讀取通知紀錄失敗");
  return res.json();
}
