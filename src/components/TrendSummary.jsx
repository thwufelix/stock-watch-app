import React from "react";
import { TREND_META } from "../utils/trendEngine.js";

export default function TrendSummary({ trend, reason }) {
  const meta = TREND_META[trend] || TREND_META.unknown;
  return (
    <div>
      <div className="badge badge-unknown" style={{ background: "rgba(148,163,184,0.08)" }}>
        <span>{meta.emoji}</span>
        <span>{meta.label}</span>
      </div>
      {reason && <p className="reason-text">{reason}</p>}
    </div>
  );
}
