# 股市監測助手（台股 · 個人版 PWA）

一個完全免費、跑在 GitHub 上的個人台股監測工具。手機安裝後長得像一個 App，
但技術上是一個「PWA」（Progressive Web App，漸進式網頁應用）：本質是網頁，但可以：

- 加到手機主畫面，用圖示點開，全螢幕顯示，沒有瀏覽器網址列，體驗接近原生 App
- 收到推播通知（即使沒開著 App）
- 離線時仍能打開最後一次抓到的資料

不需要 Apple/Google 開發者帳號、不需要上架審核、不需要付費伺服器，全部功能都靠
**GitHub Pages（免費靜態網站）+ GitHub Actions（免費排程機器人）** 完成。

## 這個工具能做什麼

- **首頁「接下來可以關注」**：根據風險是否偏高、走勢是否轉強/轉弱、有沒有新新聞，
  自動排序出今天最值得留意的自選股，不需要看懂任何技術指標數字。
- **個股頁**：用紅黃綠燈號顯示風險高低、一句話說明未來走向參考，並附上相關新聞連結。
- **投資組合風險**：輸入你的持股與大概佔比，就能看到整體風險燈號，以及「集中度」
  是否過度壓在同一個產業鏈環節。
- **產業鏈分工**：用視覺化分段呈現半導體（IC設計、晶圓代工、封測、設備、材料…）等
  產業鏈的上下游分工，點一家公司可以直接看到它的風險與走向。
- **推播通知**：排程機器人每個交易日收盤後跑一次分析，若有值得關注的股票就推播提醒。

## 技術架構一覽

```
使用者手機（瀏覽器 / PWA）
        │  讀取 public/data/*.json
        ▼
GitHub Pages（免費靜態網站託管，展示前端頁面）
        ▲  每個交易日排程寫入
        │
GitHub Actions（免費排程機器人，每天執行一次）
  1. 向證交所 OpenAPI 抓當天收盤價 → 累積成歷史序列
  2. 向 Google News RSS 抓相關新聞
  3. 計算風險燈號／走向文字／該關注哪幾檔
  4. 用 Web Push 協定推播通知到你手機
```

全部資料來源都是免費、公開、不需要金鑰的資料源（詳見 `docs/DATA_SOURCES.md`）。
金錢成本只有你自己的 Claude 訂閱，GitHub 這部分完全免費（在一般個人用量下）。

## 目錄結構

```
stock-watch-app/
├── src/                  React 前端原始碼（頁面、元件、風險/走向計算邏輯）
│   ├── pages/             Dashboard / StockDetail / Portfolio / IndustryChain / Settings
│   ├── components/        RiskBadge、TrendSummary、StockCard、NotificationSetup...
│   ├── utils/              riskEngine.js、trendEngine.js、newsMatcher.js 等核心邏輯
│   └── data/                watchlist.json（自選股清單）、industryChains.json（產業鏈資料庫）
├── worker/                GitHub Actions 執行的後端腳本（Node.js）
│   ├── fetchStockData.js  抓證交所收盤價
│   ├── fetchNews.js       抓新聞
│   ├── analyze.js         計算風險/走向，產出前端要讀的 JSON
│   ├── sendPush.js        推播通知
│   └── subscriptions/      裝置訂閱清單（見下方「開啟推播通知」）
├── public/                靜態資源（manifest.json、service worker、抓好的資料 JSON）
├── .github/workflows/     update-data.yml（排程抓資料+推播）、deploy.yml（部署到 Pages）
└── docs/                  SETUP_GUIDE.md（部署教學）、DATA_SOURCES.md（資料來源與免責聲明）
```

## 快速開始

完整步驟（含截圖說明文字、GitHub 網頁操作路徑）請看 **`docs/SETUP_GUIDE.md`**，
這裡先列出大方向：

1. 把這個資料夾上傳成你自己的 GitHub repo
2. 到 repo 的 Settings → Pages，來源選擇「GitHub Actions」
3. 產生一組 VAPID 金鑰（推播通知用），設定成 repo 的 Secrets
4. 手動觸發一次 `update-data` workflow，確認資料抓取成功
5. 打開你的 GitHub Pages 網址，把網頁加到手機主畫面
6. 在 App 的「設定」頁啟用通知，把產生的訂閱資訊貼回 repo

## 修改監測的股票 / 產業鏈資料

- 想追蹤的股票清單：編輯 `src/data/watchlist.json`
- 產業鏈分工資料：編輯 `src/data/industryChains.json`（目前內建半導體產業鏈，
  以及一個 AI 伺服器供應鏈的擴充範例，可以照格式自行新增其他產業）

改完 commit + push，下次排程執行或下次部署就會套用。

## 重要聲明

這個工具所有的「風險燈號」「走向參考」都是規則型統計判斷（波動度、均線相對位置、
新聞關鍵字），**不是專業投資建議，也沒有任何人工审核**。所有分析結果僅供參考，
投資決策請自行查證並審慎評估風險。
