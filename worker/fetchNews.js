// worker/fetchNews.js
// 用 Google News RSS（免費、免金鑰）針對自選股清單逐一搜尋相關新聞，
// 整理成 public/data/news.json，供前端顯示與推播使用。
//
// 資料來源：Google News RSS（https://news.google.com/rss/search）
// 這不是官方財經資料 API，只是新聞標題與連結的彙整，正確性與即時性以原始新聞來源為準。

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Parser from "rss-parser";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "public", "data");
const NEWS_FILE = path.join(DATA_DIR, "news.json");
const WATCHLIST_FILE = path.join(ROOT, "src", "data", "watchlist.json");

const MAX_ITEMS_PER_STOCK = 4;
const REQUEST_DELAY_MS = 600; // 放慢速度，避免對 Google News 造成過大壓力

const parser = new Parser({
  customFields: { item: ["source"] },
});

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildRssUrl(query) {
  const q = encodeURIComponent(query);
  return `https://news.google.com/rss/search?q=${q}&hl=zh-TW&gl=TW&ceid=TW:zh-Hant`;
}

async function fetchNewsForStock(stock) {
  const query = `${stock.name} 股票`;
  const url = buildRssUrl(query);
  try {
    const feed = await parser.parseURL(url);
    const items = (feed.items || []).slice(0, MAX_ITEMS_PER_STOCK).map((item) => ({
      title: item.title,
      link: item.link,
      publishedAt: item.pubDate || null,
      source: item.source?._ || item.creator || null,
    }));
    return items;
  } catch (err) {
    console.warn(`抓取 ${stock.name}(${stock.code}) 新聞失敗：${err.message}`);
    return [];
  }
}

async function main() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const watchlist = JSON.parse(fs.readFileSync(WATCHLIST_FILE, "utf-8")).default;

  const result = {
    updatedAt: new Date().toISOString(),
    byStock: {},
  };

  for (const stock of watchlist) {
    console.log(`搜尋新聞：${stock.name}(${stock.code})`);
    const items = await fetchNewsForStock(stock);
    result.byStock[stock.code] = items;
    await sleep(REQUEST_DELAY_MS);
  }

  fs.writeFileSync(NEWS_FILE, JSON.stringify(result, null, 2), "utf-8");
  console.log(`新聞資料已寫入 ${path.relative(ROOT, NEWS_FILE)}`);
}

main().catch((err) => {
  console.error("抓取新聞失敗：", err);
  process.exitCode = 1;
});
