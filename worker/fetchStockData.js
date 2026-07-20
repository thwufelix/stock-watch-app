// worker/fetchStockData.js
// 從證交所 OpenAPI（免費、免金鑰）抓取「今天」的個股收盤資訊，
// 並累加進 public/data/price_history.json，逐日堆疊出歷史序列供風險/走勢分析使用。
//
// 資料來源：台灣證券交易所 OpenAPI
// https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_ALL
//
// 注意：此端點只回傳「當天」全市場個股資料，沒有歷史資料可一次查詢，
// 所以我們靠每天排程執行、逐日累積，資料量會隨時間慢慢變豐富。
// 剛啟用的前 20 個交易日，風險/走勢分析會顯示「資料累積中」。

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "public", "data");
const HISTORY_FILE = path.join(DATA_DIR, "price_history.json");
const WATCHLIST_FILE = path.join(ROOT, "src", "data", "watchlist.json");

const TWSE_URL = "https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_ALL";
const MAX_HISTORY_POINTS = 120; // 每檔股票最多保留約半年交易日資料，避免 repo 越長越大

function todayTaipeiDateString() {
  // 用台北時區的日期當作這筆資料的日期戳記
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Taipei" });
  return fmt.format(new Date()); // yyyy-mm-dd
}

async function main() {
  fs.mkdirSync(DATA_DIR, { recursive: true });

  const watchlist = JSON.parse(fs.readFileSync(WATCHLIST_FILE, "utf-8")).default;
  const watchCodes = new Set(watchlist.map((s) => s.code));

  console.log(`向證交所 OpenAPI 請求全市場收盤資料...`);
  const res = await fetch(TWSE_URL, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    throw new Error(`TWSE OpenAPI 回應錯誤：${res.status} ${res.statusText}`);
  }
  const allStocks = await res.json();

  let history = {};
  if (fs.existsSync(HISTORY_FILE)) {
    history = JSON.parse(fs.readFileSync(HISTORY_FILE, "utf-8"));
  }

  const today = todayTaipeiDateString();
  let updatedCount = 0;

  for (const row of allStocks) {
    const code = row.Code;
    if (!watchCodes.has(code)) continue;

    const close = parseFloat(row.ClosingPrice);
    const open = parseFloat(row.OpeningPrice);
    const high = parseFloat(row.HighestPrice);
    const low = parseFloat(row.LowestPrice);
    const volume = parseInt(row.TradeVolume, 10);

    if (!Number.isFinite(close)) continue; // 當天可能停牌或資料異常，跳過

    if (!history[code]) history[code] = [];
    const series = history[code];

    // 避免同一天重複執行時把同一天資料塞兩次
    if (series.length && series[series.length - 1].date === today) {
      series[series.length - 1] = { date: today, close, open, high, low, volume };
    } else {
      series.push({ date: today, close, open, high, low, volume });
    }

    if (series.length > MAX_HISTORY_POINTS) {
      history[code] = series.slice(series.length - MAX_HISTORY_POINTS);
    }
    updatedCount++;
  }

  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), "utf-8");
  console.log(`完成，更新了 ${updatedCount} / ${watchCodes.size} 檔自選股的今日資料（${today}）。`);

  if (updatedCount === 0) {
    console.warn(
      "警告：沒有任何自選股取得資料，可能是非交易日、TWSE API 暫時無回應，或股票代號有誤。"
    );
  }
}

main().catch((err) => {
  console.error("抓取股價資料失敗：", err);
  process.exitCode = 1;
});
