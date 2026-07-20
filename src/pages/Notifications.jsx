import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { loadNotificationHistory } from "../utils/dataClient.js";

// 通知累積頁：回顧每天系統推播過的「今日關注」內容。
export default function Notifications() {
  const [history, setHistory] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadNotificationHistory()
      .then(setHistory)
      .catch(() => setError(true));
  }, []);

  return (
    <div>
      <h1>通知紀錄</h1>
      <p className="subtitle">每天早上推播過的「今日關注」都會累積在這裡，方便回顧。</p>

      {error && (
        <div className="empty-state">
          還沒有任何通知紀錄。
          <br />
          排程執行且當天有值得關注的股票後，就會開始累積。
        </div>
      )}

      {!error && !history && <div className="empty-state">資料讀取中...</div>}

      {history && history.length === 0 && (
        <div className="empty-state">
          還沒有任何通知紀錄。
          <br />
          排程執行且當天有值得關注的股票後，就會開始累積。
        </div>
      )}

      {history &&
        history.map((entry) => (
          <div className="card" key={entry.date}>
            <div className="card-row">
              <strong>{entry.title}</strong>
              <span className="stock-code">{entry.date}</span>
            </div>
            {entry.stocks.map((s) => (
              <Link to={`/stock/${s.code}`} key={s.code}>
                <p className="reason-text">
                  <span className="tag" style={{ marginRight: 6 }}>
                    {s.name} {s.code}
                  </span>
                  {s.reasons.join("、")}
                </p>
              </Link>
            ))}
          </div>
        ))}
    </div>
  );
}
