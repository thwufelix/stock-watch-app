import React from "react";
import { RISK_META } from "../utils/riskEngine.js";

export default function RiskBadge({ tier, size = "normal" }) {
  const meta = RISK_META[tier] || RISK_META.unknown;
  return (
    <span className={`badge badge-${tier}`} style={size === "large" ? { fontSize: 15, padding: "6px 14px" } : undefined}>
      <span>{meta.emoji}</span>
      <span>{meta.label}</span>
    </span>
  );
}
