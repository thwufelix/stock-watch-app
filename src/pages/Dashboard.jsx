import React, { useEffect, useState } from "react";
import StockCard from "../components/StockCard.jsx";
import { loadDashboard } from "../utils/dataClient.js";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboard()
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div>
      <h1>接下來可以關注</h1>
      <p className="subtitle">
        根據近期波動、走勢變化與新聞動態排序，越靠前面越值得留意。
      </p>

      {error && (
        <div className="empty-state">
          資料讀取失敗：{error}
          <br />
          請確認 GitHub Actions 排程是否已成功執行過一次。
        </div>
      )}

      {!error && !data && <div className="empty-state">資料讀取中...</div>}

      {data && data.stocks.length === 0 && (
        <div className="empty-state">
          目前還沒有任何自選股資料。
          <br />
          請到「設定」加入股票，並確認排程已執行。
        </div>
      )}

      {data &&
        data.stocks.map((stock) => <StockCard key={stock.code} stock={stock} />)}

      {data && (
        <p className="disclaimer">
          資料更新時間：{data.updatedAt ? new Date(data.updatedAt).toLocaleString("zh-TW") : "尚未更新"}
          。本頁面所有分析皆為自動化統計判斷，僅供參考，不構成投資建議，投資請自行審慎評估風險。
        </p>
      )}
    </div>
  );
}
