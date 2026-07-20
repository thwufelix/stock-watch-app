// worker/sendPush.js
// 讀取 worker/subscriptions/subscriptions.json 裡的訂閱清單，
// 把 push_candidates.json 整理成一則通知，用 Web Push 協定推播出去。
//
// 為什麼要手動維護 subscriptions.json？
// 因為這個專案是純靜態網站（部署在 GitHub Pages），沒有自己的後端伺服器可以即時
// 接收手機瀏覽器送出的訂閱資訊。所以流程是：
//   1. 在手機上打開 App -> 設定頁 -> 「開啟通知」，瀏覽器會產生一組訂閱資訊(JSON)
//   2. App 會把這組 JSON 顯示出來，你把它複製貼上到 worker/subscriptions/subscriptions.json
//   3. commit + push 回 GitHub，之後排程執行時就能對這個裝置推播
// 詳細步驟請見 docs/SETUP_GUIDE.md。

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import webpush from "web-push";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SUBS_FILE = path.join(ROOT, "worker", "subscriptions", "subscriptions.json");
const PUSH_CANDIDATES_FILE = path.join(ROOT, "public", "data", "push_candidates.json");

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:example@example.com";
const SITE_URL = process.env.SITE_URL || "./";

function readJsonSafe(file, fallback) {
  if (!fs.existsSync(file)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch {
    return fallback;
  }
}

function buildNotificationPayload(candidates) {
  if (candidates.length === 0) {
    return null; // 沒有值得關注的股票就不推播，避免通知疲勞
  }
  const names = candidates.map((c) => c.name).join("、");
  const top = candidates[0];
  const topReason = top.attentionReasons?.[0] || "有新動態";

  return {
    title: `今日關注：${names}`,
    body: `${top.name}：${topReason}。點我看完整說明。`,
    tag: "daily-watch",
    data: { url: SITE_URL },
  };
}

async function main() {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.log("未設定 VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY，略過推播（僅更新資料，不發通知）。");
    return;
  }

  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

  const subscriptions = readJsonSafe(SUBS_FILE, []);
  if (subscriptions.length === 0) {
    console.log("尚未有任何裝置訂閱通知，略過推播。");
    return;
  }

  const candidates = readJsonSafe(PUSH_CANDIDATES_FILE, []);
  const payload = buildNotificationPayload(candidates);
  if (!payload) {
    console.log("今天沒有值得特別關注的股票，不發送通知。");
    return;
  }

  let success = 0;
  let failed = 0;
  const stillValid = [];

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(sub, JSON.stringify(payload));
      success++;
      stillValid.push(sub);
    } catch (err) {
      failed++;
      // 410/404 代表這個訂閱已經失效（使用者移除了通知權限或解除安裝）
      if (err.statusCode === 410 || err.statusCode === 404) {
        console.log(`訂閱已失效，將從清單移除：${sub.endpoint?.slice(0, 60)}...`);
      } else {
        console.warn(`推播失敗（保留此訂閱以便下次重試）：${err.message}`);
        stillValid.push(sub);
      }
    }
  }

  if (stillValid.length !== subscriptions.length) {
    fs.writeFileSync(SUBS_FILE, JSON.stringify(stillValid, null, 2), "utf-8");
  }

  console.log(`推播完成：成功 ${success} 則，失敗 ${failed} 則。`);
}

main().catch((err) => {
  console.error("推播流程發生錯誤：", err);
  process.exitCode = 1;
});
