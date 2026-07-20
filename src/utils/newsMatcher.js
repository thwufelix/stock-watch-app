// src/utils/newsMatcher.js
// 決定「今天该不该推播提醒」以及要優先呈現在 Dashboard 最上方的股票清單。
// 判斷依據刻意簡單、可解釋：風險燈號轉紅、走向翻轉、或當天有新新聞，就視為值得關注。

const URGENT_KEYWORDS = ["重訊", "下修", "調降", "上修", "調升", "跳空", "停牌", "違約", "財報", "法說"];

/**
 * @param {Array<{code:string, name:string, riskTier:string, trend:string, news:Array}>} stocks
 * @returns {Array} 依「值得關注程度」排序後的清單，並附上原因標籤
 */
export function rankStocksForAttention(stocks) {
  return stocks
    .map((s) => {
      let score = 0;
      const reasons = [];

      if (s.riskTier === "high") {
        score += 3;
        reasons.push("風險燈號偏高");
      }
      if (s.trend === "up" || s.trend === "down") {
        score += 2;
        reasons.push(s.trend === "up" ? "走勢轉強" : "走勢轉弱");
      }

      const freshNews = (s.news || []).filter((n) => isWithinHours(n.publishedAt, 36));
      if (freshNews.length > 0) {
        score += 1;
        reasons.push(`近期有 ${freshNews.length} 則相關新聞`);
      }

      const hasUrgentNews = freshNews.some((n) =>
        URGENT_KEYWORDS.some((kw) => n.title?.includes(kw))
      );
      if (hasUrgentNews) {
        score += 2;
        reasons.push("新聞含重大字眼，建議留意");
      }

      return { ...s, attentionScore: score, attentionReasons: reasons };
    })
    .sort((a, b) => b.attentionScore - a.attentionScore);
}

function isWithinHours(dateStr, hours) {
  if (!dateStr) return false;
  const t = new Date(dateStr).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() - t <= hours * 60 * 60 * 1000;
}

/**
 * 決定今天要推播的股票（只挑 attentionScore 達門檻的前幾名，避免通知疲勞）
 */
export function pickPushCandidates(rankedStocks, { maxCount = 3, minScore = 3 } = {}) {
  return rankedStocks.filter((s) => s.attentionScore >= minScore).slice(0, maxCount);
}
