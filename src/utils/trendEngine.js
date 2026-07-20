// src/utils/trendEngine.js
// 把均線交叉這種技術分析概念，轉換成一句話的「未來走向」文字描述，
// 不呈現線圖或數字，降低不熟悉股市的人的理解門檻。

export const TREND = {
  UP: "up",
  DOWN: "down",
  FLAT: "flat",
  UNKNOWN: "unknown",
};

export const TREND_META = {
  up: { emoji: "📈", label: "轉強" },
  down: { emoji: "📉", label: "轉弱" },
  flat: { emoji: "➡️", label: "持平整理" },
  unknown: { emoji: "❔", label: "資料累積中" },
};

const MIN_POINTS_FOR_TREND = 20;

function movingAverage(series, window) {
  if (series.length < window) return null;
  const slice = series.slice(-window);
  const sum = slice.reduce((a, p) => a + p.close, 0);
  return sum / window;
}

/**
 * 用短期均線(5日) vs 長期均線(20日)的相對位置與最近變化，判斷簡化版走向文字
 * @param {{date:string, close:number}[]} series 依日期由舊到新排序
 */
export function assessTrend(series) {
  if (!series || series.length < MIN_POINTS_FOR_TREND) {
    return {
      trend: TREND.UNKNOWN,
      reason: `資料還在累積中（目前 ${series?.length || 0} 個交易日），累積滿 ${MIN_POINTS_FOR_TREND} 個交易日後就能提供走向參考。`,
    };
  }

  const ma5 = movingAverage(series, 5);
  const ma20 = movingAverage(series, 20);
  const latestClose = series[series.length - 1].close;
  const gapPct = ((ma5 - ma20) / ma20) * 100;

  let trend;
  let reason;
  if (gapPct > 1.5) {
    trend = TREND.UP;
    reason = "短期股價站上中期均線之上，走勢動能偏多，但仍可能受大盤或消息面影響反轉。";
  } else if (gapPct < -1.5) {
    trend = TREND.DOWN;
    reason = "短期股價落在中期均線之下，走勢動能偏弱，建議留意是否有進一步利空消息。";
  } else {
    trend = TREND.FLAT;
    reason = "短期與中期股價走勢接近，目前處於盤整階段，尚未出現明確方向。";
  }

  return { trend, reason, latestClose };
}
