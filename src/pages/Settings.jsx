import React from "react";
import watchlistData from "../data/watchlist.json";
import NotificationSetup from "../components/NotificationSetup.jsx";

export default function Settings() {
  return (
    <div>
      <h1>設定</h1>

      <h2>通知</h2>
      <NotificationSetup />

      <h2>目前監測中的股票</h2>
      <div className="card">
        <div className="chip-row">
          {watchlistData.default.map((s) => (
            <span className="chip" key={s.code}>
              {s.name} {s.code}
            </span>
          ))}
        </div>
        <p className="reason-text">
          要增加或移除監測的股票，請編輯 repo 裡的 <code>src/data/watchlist.json</code>，
          再 commit + push，下次排程執行時就會套用新的清單。這樣設計是因為資料抓取與分析是由
          GitHub Actions 排程在背景完成，不是手機當下即時運算。
        </p>
      </div>

      <h2>關於</h2>
      <div className="card">
        <p className="reason-text" style={{ marginTop: 0 }}>
          這是一個開源、免費、完全跑在 GitHub 上的個人股市監測工具。所有分析（風險燈號、走向、
          組合風險）都是規則型統計判斷，不是投資顧問，請勿完全依賴本工具做投資決策。
        </p>
      </div>
    </div>
  );
}
