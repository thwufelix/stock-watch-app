// worker/backfillHistory.js
// 一次性「回補歷史股價」：讓風險與走向判斷不用從今天開始慢慢累積資料，
// 而是直接用過去約半年的真實歷史資料計算。
//
// 資料來源：證交所個股日成交資訊（免費、免金鑰）
//   https://www.twse.com.tw/rwd/zh/afterTrading/STOCK_DAY?date=YYYYMMDD&stockNo=2330&response=json
//   一次回傳「該股票該月份」的每日資料，所以要逐股票 × 逐月份請求。
//
// 注意：證交所對請求頻率有限制（過快會被暫時封鎖），所以每次請求間隔 3.5 秒。
// 46 檔股票 × 6 個月 ≈ 276 次請求，全部跑完約 16 分鐘，適合放在 GitHub Actions 跑。
// 這個腳本只需要執行一次（或新增股票後再執行），日常更新仍由 fetchStockData.js 負責。

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "public", "data");
const HISTORY_FILE = path.join(DATA_DIR, "price_history.json");
const WATCHLIST_FILE = path.join(ROOT, "src", "data", "watchlist.json");

const MONTHS_BACK = parseInt(process.env.MONTHS_BACK || "6", 10);
const REQUEST_DELAY_MS = 3500;
const MAX_HISTORY_POINTS = 120;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// 民國日期 "115/07/01" → "2026-07-01"
function rocDateToIso(rocDate) {
  const [y, m, d] = rocDate.split("/");
  return `${parseInt(y, 10) + 1911}-${m}-${d}`;
}

function parseNum(s) {
  if (s === undefined || s === null) return NaN;
  return parseFloat(String(s).replace(/,/g, ""));
}

// 產生要查詢的月份清單（含當月），格式 YYYYMM01
function monthsToFetch(n) {
  const list = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    list.push(`${y}${m}01`);
  }
  return list;
}

async function fetchMonth(code, dateStr) {
  const url = `https://www.twse.com.tw/rwd/zh/afterTrading/STOCK_DAY?date=${dateStr}&stockNo=${code}&response=json`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (json.stat !== "OK" || !Array.isArray(json.data)) return [];
  // data 欄位順序：0日期 1成交股數 2成交金額 3開盤 4最高 5最低 6收盤 7漲跌 8成交筆數
  return json.data
    .map((row) => ({
      date: rocDateToIso(row[0]),
      open: parseNum(row[3]),
      high: parseNum(row[4]),
      low: parseNum(row[5]),
      close: parseNum(row[6]),
      volume: parseNum(row[1]),
    }))
    .filter((r) => Number.isFinite(r.close));
}

async function main() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const watchlist = JSON.parse(fs.readFileSync(WATCHLIST_FILE, "utf-8")).default;
  let history = {};
  if (fs.existsSync(HISTORY_FILE)) {
    history = JSON.parse(fs.readFileSync(HISTORY_FILE, "utf-8"));
  }

  const months = monthsToFetch(MONTHS_BACK);
  console.log(`回補範圍：${months[0]} ~ ${months[months.length - 1]}，共 ${watchlist.length} 檔股票`);

  for (const stock of watchlist) {
    // 已有足夠歷史資料的股票直接跳過，避免重複請求
    const existing = history[stock.code] || [];
    if (existing.length >= MAX_HISTORY_POINTS - 10) {
      console.log(`跳過 ${stock.name}(${stock.code})：已有 ${existing.length} 筆資料`);
      continue;
    }

    const byDate = new Map(existing.map((r) => [r.date, r]));
    let fetched = 0;

    for (const m of months) {
      try {
        const rows = await fetchMonth(stock.code, m);
        for (const r of rows) byDate.set(r.date, r);
        fetched += rows.length;
      } catch (err) {
        console.warn(`  ${stock.code} ${m} 失敗：${err.message}（略過此月）`);
      }
      await sleep(REQUEST_DELAY_MS);
    }

    const series = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
    history[stock.code] = series.slice(-MAX_HISTORY_POINTS);
    console.log(`完成 ${stock.name}(${stock.code})：抓到 ${fetched} 筆，累計 ${history[stock.code].length} 筆`);

    // 邊跑邊存檔，就算中途失敗也保留已完成的部分
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), "utf-8");
  }

  console.log("歷史資料回補完成。");
}

main().catch((err) => {
  console.error("回補失敗：", err);
  process.exitCode = 1;
});
