# 部署教學（從零開始，一步一步）

這份教學假設你完全沒有部署過網站，只需要一個 GitHub 帳號即可。全程不會花任何錢。

## 第一步：把專案上傳到你自己的 GitHub

1. 到 [github.com](https://github.com) 建立一個新的 repository（例如叫 `stock-watch-app`），
   設成 Public（Public 才能用免費的 GitHub Pages）。
2. 把這整個資料夾的內容 push 上去。如果你電腦上已經裝了 git，在這個資料夾內執行：

   ```bash
   git init
   git add .
   git commit -m "init: 股市監測助手"
   git branch -M main
   git remote add origin https://github.com/<你的帳號>/<repo名稱>.git
   git push -u origin main
   ```

   如果不熟悉指令列，也可以直接在 GitHub 網頁上用「Upload files」把資料夾內容拖拉上傳。

## 第二步：開啟 GitHub Pages

1. 到 repo 頁面 → **Settings** → 左側選單 **Pages**
2. 「Build and deployment」→ Source 選擇 **GitHub Actions**（不是 Deploy from a branch）
3. 存檔即可，之後 `deploy.yml` 這個 workflow 會自動負責建置與部署

## 第三步：產生 VAPID 金鑰（推播通知用）

VAPID 金鑰是「Web Push 推播」的身分驗證機制，公鑰放進前端程式碼、私鑰放在 GitHub Secrets，
兩者搭配才能安全地推播通知，不需要任何第三方帳號。

在你電腦上（需要先安裝 Node.js）執行：

```bash
npx web-push generate-vapid-keys
```

會印出類似這樣的東西：

```
=======================================
Public Key:
BN4...一長串英數字...
Private Key:
xyz...一長串英數字...
=======================================
```

把這兩組值記下來（先別關掉終端機視窗）。

## 第四步：設定 GitHub Secrets

到 repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**，
新增以下三筆：

| Name | Value |
|---|---|
| `VAPID_PUBLIC_KEY` | 剛剛產生的 Public Key |
| `VAPID_PRIVATE_KEY` | 剛剛產生的 Private Key |
| `VAPID_SUBJECT` | `mailto:你的Email`，例如 `mailto:ericppqq@gmail.com` |

存好之後，回到 **Actions** 分頁，觸發一次部署：
點選左側 `建置並部署到 GitHub Pages` → **Run workflow** → **Run workflow**。

等它跑完（約 1-2 分鐘），到 Settings → Pages 頁面上方會看到你的網址，
長得像：`https://<你的帳號>.github.io/<repo名稱>/`

## 第五步：手動觸發一次資料更新

第一次部署時，`public/data/` 裡的資料檔案還是空的。到 **Actions** 分頁，
點選左側 `更新股市資料並推播通知` → **Run workflow** → **Run workflow**。

跑完之後（約 1-2 分鐘），因為這個 workflow 會 commit 新資料回 repo，
會自動觸發一次新的部署，稍等一下再重新整理你的網站，就會看到資料出現了。

> 之後不需要手動做這件事，`update-data.yml` 已經設定成每個交易日下午 2:30
> （台北時間）自動執行一次。

## 第六步：把網頁加到手機主畫面

打開你的 GitHub Pages 網址（用手機瀏覽器）：

**iPhone（Safari）：**
1. 點下方分享圖示（方框+箭頭）
2. 選「加入主畫面」
3. 之後務必從主畫面的圖示打開，而不是繼續用 Safari 分頁，通知功能才會生效
   （iOS 16.4 以上才支援網頁推播通知）

**Android（Chrome）：**
1. 點右上角選單（三個點）
2. 選「安裝應用程式」或「加到主畫面」

## 第七步：在手機上開啟通知

1. 從主畫面圖示打開 App
2. 到「設定」頁 → 點「啟用通知並產生訂閱資訊」
3. 允許瀏覽器的通知權限
4. 畫面會出現一段 JSON 文字，點「複製訂閱資訊」

接著要把這段資訊帶回 repo：

1. 到 GitHub 網頁，開啟 `worker/subscriptions/subscriptions.json`
2. 點右上角鉛筆圖示編輯
3. 原本內容是 `[]`，把它改成一個陣列，貼入剛剛複製的內容，例如：

   ```json
   [
     {
       "endpoint": "https://fcm.googleapis.com/fcm/send/xxxxxxxx",
       "expirationTime": null,
       "keys": {
         "p256dh": "....",
         "auth": "...."
       }
     }
   ]
   ```

   如果你有多台裝置（例如手機+平板都想收通知），就在陣列裡用逗號隔開放多筆。

4. 直接在網頁上 **Commit changes**

下次排程執行、判定有值得關注的股票時，就會推播到這台裝置。你也可以到 Actions 頁面
手動觸發 `更新股市資料並推播通知` 立即測試。

## 常見問題

**Q: 完全沒收到通知？**
先確認：(1) Secrets 三筆都設好了 (2) subscriptions.json 裡確實有你的訂閱資料
(3) iPhone 必須從「加入主畫面」的圖示開啟，Safari 分頁模式不支援推播
(4) 當天分析結果如果沒有股票被列為「值得關注」，系統會刻意不發通知，避免通知疲勞。

**Q: 想追蹤的股票不在清單裡？**
編輯 `src/data/watchlist.json` 加入股票代號與名稱，commit + push 即可，
下次排程執行時就會納入分析。

**Q: 訂閱資訊會過期嗎？**
瀏覽器偶爾會讓訂閱失效（例如清除瀏覽資料、太久沒開啟）。`sendPush.js` 偵測到
失效的訂閱時會自動從清單移除，屆時只要重新做一次第七步即可。

**Q: 想改成每天更新多次？**
編輯 `.github/workflows/update-data.yml` 裡的 `cron` 設定即可，語法可參考
[crontab.guru](https://crontab.guru/)（記得時間是 UTC，需自行 -8 小時換算成台北時間）。
