// src/utils/riskEngine.js
// 把「波動度」這種數字概念，轉換成一般人看得懂的紅黃綠燈號 + 一句話說明。
// 刻意不在介面上呈現年化波動度、標準差等數字，只保留判斷邏輯本身。

export const RISK_TIER = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  UNKNOWN: "unknown",
};

export const RISK_META = {
  low: { color: "#22c55e", emoji: "🟢", label: "風險偏低" },
  medium: { color: "#eab308", emoji: "🟡", label: "風險中等" },
  high: { color: "#ef4444", emoji: "🔴", label: "風險偏高" },
  unknown: { color: "#94a3b8", emoji: "⚪", label: "資料累積中" },
};

const MIN_POINTS_FOR_RISK = 10; // 至少要有 10 個交易日資料才敢下判斷

/**
 * 計算日報酬率序列
 * @param {{date:string, close:number}[]} series 依日期由舊到新排序的價格序列
 */
function dailyReturns(series) {
  const returns = [];
  for (let i = 1; i < series.length; i++) {
    const prev = series[i - 1].close;
    const curr = series[i].close;
    if (prev > 0) returns.push((curr - prev) / prev);
  }
  return returns;
}

function stdDev(values) {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

/**
 * 依近期波動度評估個股風險燈號
 * @param {{date:string, close:number}[]} series
 * @returns {{tier:string, annualizedVolatilityPct:number|null, reason:string}}
 */
export function assessStockRisk(series) {
  if (!series || series.length < MIN_POINTS_FOR_RISK) {
    return {
      tier: RISK_TIER.UNKNOWN,
      annualizedVolatilityPct: null,
      reason: `目前只累積了 ${series?.length || 0} 個交易日資料，至少需要 ${MIN_POINTS_FOR_RISK} 天才能判斷風險，請再等幾天。`,
    };
  }

  const recent = series.slice(-20); // 取最近最多 20 個交易日
  const returns = dailyReturns(recent);
  const daily = stdDev(returns);
  const annualizedPct = daily * Math.sqrt(252) * 100;

  let tier;
  let reason;
  if (annualizedPct < 25) {
    tier = RISK_TIER.LOW;
    reason = "近期股價波動相對平穩，短線大起大落的機會較低。";
  } else if (annualizedPct < 45) {
    tier = RISK_TIER.MEDIUM;
    reason = "近期股價有一定幅度的上下震盪，建議留意消息面變化。";
  } else {
    tier = RISK_TIER.HIGH;
    reason = "近期股價波動明顯放大，短線漲跌幅度較大，請留意部位大小。";
  }

  return { tier, annualizedVolatilityPct: Math.round(annualizedPct * 10) / 10, reason };
}

/**
 * 計算「集中度」風險：一個投資組合裡，某個產業鏈環節佔比過高會被標記
 * @param {{code:string, weightPct:number, segmentId:string}[]} holdings
 * @returns {{tier:string, reason:string, topSegment:{segmentId:string, weightPct:number}|null}}
 */
export function assessConcentrationRisk(holdings) {
  if (!holdings || holdings.length === 0) {
    return { tier: RISK_TIER.UNKNOWN, reason: "尚未設定持股，無法評估集中度。", topSegment: null };
  }
  const bySegment = {};
  for (const h of holdings) {
    const key = h.segmentId || "未分類";
    bySegment[key] = (bySegment[key] || 0) + h.weightPct;
  }
  const sorted = Object.entries(bySegment).sort((a, b) => b[1] - a[1]);
  const [topSegmentId, topWeight] = sorted[0];

  let tier;
  let reason;
  if (topWeight >= 60) {
    tier = RISK_TIER.HIGH;
    reason = `投資組合有 ${Math.round(topWeight)}% 集中在同一個產業鏈環節，一旦該環節景氣反轉，portfolio 會受到較大衝擊，建議適度分散。`;
  } else if (topWeight >= 35) {
    tier = RISK_TIER.MEDIUM;
    reason = `投資組合有 ${Math.round(topWeight)}% 落在同一個產業鏈環節，集中度中等，可以留意但不必過度緊張。`;
  } else {
    tier = RISK_TIER.LOW;
    reason = "投資組合分散在不同產業鏈環節，單一環節景氣變化對整體影響有限。";
  }

  return { tier, reason, topSegment: { segmentId: topSegmentId, weightPct: Math.round(topWeight) } };
}

/**
 * 綜合個股風險（平均）與集中度風險，得出整體 portfolio 風險燈號
 */
export function combinePortfolioRisk(stockRiskTiers, concentrationTier) {
  const rank = { low: 0, medium: 1, high: 2, unknown: 0 };
  const stockScore =
    stockRiskTiers.length > 0
      ? stockRiskTiers.reduce((a, t) => a + rank[t], 0) / stockRiskTiers.length
      : 0;
  const concentrationScore = rank[concentrationTier] ?? 0;
  const combined = Math.max(stockScore, concentrationScore);

  if (combined < 0.7) return RISK_TIER.LOW;
  if (combined < 1.4) return RISK_TIER.MEDIUM;
  return RISK_TIER.HIGH;
}
