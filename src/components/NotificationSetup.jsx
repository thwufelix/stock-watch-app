import React, { useState } from "react";

// 把 base64url 格式的 VAPID 公鑰轉成瀏覽器 API 需要的 Uint8Array 格式
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export default function NotificationSetup() {
  const [status, setStatus] = useState("idle"); // idle | subscribing | done | error
  const [subscriptionJson, setSubscriptionJson] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [copied, setCopied] = useState(false);

  const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  const supported = "serviceWorker" in navigator && "PushManager" in window;

  async function handleSubscribe() {
    setStatus("subscribing");
    setErrorMsg(null);
    try {
      if (!vapidPublicKey) {
        throw new Error(
          "尚未設定 VAPID 公鑰（VITE_VAPID_PUBLIC_KEY），請先依照 SETUP_GUIDE.md 產生金鑰並設定。"
        );
      }
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        throw new Error("你拒絕了通知權限，如需開啟請到瀏覽器設定重新允許。");
      }
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
      setSubscriptionJson(JSON.stringify(subscription.toJSON(), null, 2));
      setStatus("done");
    } catch (err) {
      setErrorMsg(err.message);
      setStatus("error");
    }
  }

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(subscriptionJson);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 部分瀏覽器可能不支援剪貼簿 API，忽略即可，使用者仍可手動選取複製
    }
  }

  if (!supported) {
    return (
      <div className="card">
        <p className="reason-text">
          這個瀏覽器不支援推播通知。若在 iPhone 上使用，請先「加入主畫面」把 App 安裝起來後，
          從主畫面圖示開啟才能使用通知功能（iOS 16.4 以上）。
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <p className="reason-text" style={{ marginTop: 0 }}>
        啟用後，瀏覽器會產生一組「訂閱資訊」，你需要把它複製貼上到 repo 裡的
        <code> worker/subscriptions/subscriptions.json</code>，commit + push 回 GitHub，
        之後排程才能推播到這台裝置。詳細步驟見 SETUP_GUIDE.md。
      </p>
      <button className="primary" onClick={handleSubscribe} disabled={status === "subscribing"}>
        {status === "subscribing" ? "設定中..." : "啟用通知並產生訂閱資訊"}
      </button>

      {errorMsg && <p className="reason-text" style={{ color: "#ef4444" }}>{errorMsg}</p>}

      {subscriptionJson && (
        <div style={{ marginTop: 12 }}>
          <textarea
            readOnly
            value={subscriptionJson}
            rows={8}
            style={{
              width: "100%",
              fontFamily: "monospace",
              fontSize: 12,
              background: "#0b1220",
              color: "#f1f5f9",
              border: "1px solid #334155",
              borderRadius: 8,
              padding: 8,
            }}
          />
          <button onClick={copyToClipboard} style={{ marginTop: 8 }}>
            {copied ? "已複製 ✓" : "複製訂閱資訊"}
          </button>
        </div>
      )}
    </div>
  );
}
