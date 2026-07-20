import React from "react";
import { Link } from "react-router-dom";
import RiskBadge from "./RiskBadge.jsx";
import { TREND_META } from "../utils/trendEngine.js";

export default function StockCard({ stock }) {
  const trendMeta = TREND_META[stock.trend] || TREND_META.unknown;
  return (
    <Link to={`/stock/${stock.code}`}>
      <div className="card">
        <div className="card-row">
          <div>
            <span className="stock-name">{stock.name}</span>
            <span className="stock-code">{stock.code}</span>
          </div>
          <span style={{ fontSize: 20 }}>{trendMeta.emoji}</span>
        </div>
        <div className="card-row" style={{ marginTop: 8 }}>
          <RiskBadge tier={stock.riskTier} />
          {stock.segment && <span className="tag">{stock.segment.segmentName}</span>}
        </div>
        {stock.attentionReasons?.length > 0 && (
          <p className="reason-text">關注原因：{stock.attentionReasons.join("、")}</p>
        )}
      </div>
    </Link>
  );
}
