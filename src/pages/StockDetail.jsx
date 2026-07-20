import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import RiskBadge from "../components/RiskBadge.jsx";
import TrendSummary from "../components/TrendSummary.jsx";
import { loadDashboard } from "../utils/dataClient.js";

export default function StockDetail() {
  const { code } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    loadDashboard().then(setData);
  }, []);

  const stock = data?.stocks.find((s) => s.code === code);

  if (!data) return <div className="empty-state">資料讀取中...</div>;
  if (!stock) return <div className="empty-state">找不到這檔股票的資料。</div>;

  return (
    <div>
      <h1>
        {stock.name} <span className="stock-code">{stock.code}</span>
      </h1>
      {stock.lastDate && (
        <p className="subtitle">
          最新收盤日：{stock.lastDate}
          {stock.changePct !== null && (stock.changePct >= 0 ? `（較前一日 +${stock.changePct}%）` : `（較前一日 ${stock.changePct}%）`)}
        </p>
      )}

      <h2>個股風險</h2>
      <div className="card">
        <RiskBadge tier={stock.riskTier} size="large" />
        <p className="reason-text">{stock.riskReason}</p>
      </div>

      <h2>未來走向參考</h2>
      <div className="card">
        <TrendSummary trend={stock.trend} reason={stock.trendReason} />
      </div>

      {stock.segment && (
        <>
          <h2>所屬產業鏈分工</h2>
          <div className="card">
            <p>
              屬於「{stock.segment.chainName}」中的
              <strong> {stock.segment.segmentName} </strong>
              環節。
            </p>
            <Link to="/industry" className="btn" style={{ display: "inline-block", marginTop: 8 }}>
              查看完整產業鏈分工 →
            </Link>
          </div>
        </>
      )}

      <h2>相關新聞</h2>
      <div className="card">
        {stock.news && stock.news.length > 0 ? (
          stock.news.map((n, i) => (
            <a key={i} className="news-item" href={n.link} target="_blank" rel="noreferrer">
              {n.title}
              <div className="news-source">
                {n.source || "新聞來源"} {n.publishedAt ? `· ${new Date(n.publishedAt).toLocaleDateString("zh-TW")}` : ""}
              </div>
            </a>
          ))
        ) : (
          <p className="reason-text">目前沒有找到近期相關新聞。</p>
        )}
      </div>

      <p className="disclaimer">
        風險燈號依近期股價波動幅度自動評估；走向參考依短、中期均線相對位置自動評估，
        兩者皆為統計上的粗略判斷，並非專業投資建議，請自行查證後審慎決策。
      </p>
    </div>
  );
}
