// src/utils/storage.js
// 用 localStorage 儲存「使用者自己在手機上輸入」的資料（持股組合、通知偏好等）。
// 這些資料只留在使用者自己的裝置上，不會上傳到任何伺服器。

const HOLDINGS_KEY = "stockwatch:holdings";

export function getHoldings() {
  try {
    const raw = localStorage.getItem(HOLDINGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveHoldings(holdings) {
  localStorage.setItem(HOLDINGS_KEY, JSON.stringify(holdings));
}
