// worker/analyze.js
// 讀取 price_history.json + news.json，套用風險/走向邏輯，
// 產出前端 Dashboard 直接讀取的 public/data/dashboard.json，
// 以及要推播的候選名單 public/data/push_candidates.json。

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assessStockRisk } from "../src/utils/riskEngine.js";
import { assessTrend } from "../src/utils/trendEngine.js";
import { rankStocksForAttention, pickPushCandidates } from "../src/utils/newsMatcher.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "public", "data");
const HISTORY_FILE = path.join(DATA_DIR, "price_history.json");
const NEWS_FILE = path.join(DATA_DIR, "news.json");
const WATCHLIST_FILE = path.join(ROOT, "src", "data", "watchlist.json");
const INDUSTRY_FILE = path.join(ROOT, "src", "data", "industryChains.json");
const DASHBOARD_FILE = path.join(DATA_DIR, "dashboard.json");
const PUSH_CANDIDATES_FILE = path.join(DATA_DIR, "push_candidates.json");

function readJsonSafe(file, fallback) {
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}

function buildCodeToSegmentMap(industryData) {
  const map = {};
  for (const chain of industryData.chains) {
    for (const segment of chain.segments) {
      for (const company of segment.companies) {
        map[company.code] = {
          chainId: chain.id,
          chainName: chain.name,
          segmentId: segment.id,
          segmentName: segment.name,
        };
      }
    }
  }
  return map;
}

function main() {
  const watchlist = readJsonSafe(WATCHLIST_FILE, { default: [] }).default;
  const history = readJsonSafe(HISTORY_FILE, {});
  const news = readJsonSafe(NEWS_FILE, { updatedAt: null, byStock: {} });
  const industryData = readJsonSafe(INDUSTRY_FILE, { chains: [] });
  const codeToSegment = buildCodeToSegmentMap(industryData);

  const stocks = watchlist.map((stock) => {
    const series = history[stock.code] || [];
    const risk = assessStockRisk(series);
    const trendResult = assessTrend(series);
    const stockNews = news.byStock?.[stock.code] || [];
    const segmentInfo = codeToSegment[stock.code] || null;
    const last = series[series.length - 1] || null;
    const prev = series[series.length - 2] || null;
    const changePct =
      last && prev && prev.close > 0 ? ((last.close - prev.close) / prev.close) * 100 : null;

    return {
      code: stock.code,
      name: stock.name,
      lastClose: last?.close ?? null,
      lastDate: last?.date ?? null,
      changePct: changePct !== null ? Math.round(changePct * 100) / 100 : null,
      riskTier: risk.tier,
      riskReason: risk.reason,
      trend: trendResult.trend,
      trendReason: trendResult.reason,
      segment: segmentInfo,
      news: stockNews,
    };
  });

  const ranked = rankStocksForAttention(stocks);
  const pushCandidates = pickPushCandidates(ranked);

  const dashboard = {
    updatedAt: new Date().toISOString(),
    newsUpdatedAt: news.updatedAt,
    stocks: ranked,
  };

  fs.writeFileSync(DASHBOARD_FILE, JSON.stringify(dashboard, null, 2), "utf-8");
  fs.writeFileSync(PUSH_CANDIDATES_FILE, JSON.stringify(pushCandidates, null, 2), "utf-8");

  console.log(`分析完成：${stocks.length} 檔股票，其中 ${pushCandidates.length} 檔列為今日推播候選。`);
}

main();
