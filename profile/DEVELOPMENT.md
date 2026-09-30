# README 圖片產生器

本頁以 [vaclisinc/vaclis](https://github.com/vaclisinc/vaclis) 的原始碼為基底（來源 commit `9de14e0c569c98d35ffee3a98b5a2c7bbb3fe855`），保留網站字體、色彩、照片與文案。這份獨立副本不會更動原網站。

## 使用

需要 Node.js 20 以上。

```sh
npm ci
npx playwright install chromium
npm run preview
```

完整 README（含自訂 repo cards）預覽：http://127.0.0.1:4173/readme 。此頁用 Markdown 渲染 README，圖片相對路徑以 repo 根目錄解析；是本機預覽，並非 GitHub 的實際 sanitizer。

單獨圖片版面預覽：開啟 http://127.0.0.1:4173/profile/；加 `?theme=dark` 或 `?theme=light` 切換配色。`PORT=4174 npm run preview` 可改 port。

```sh
npm run export
```

匯出 script 自動啟動暫時的本機 server，使用 Chromium 等待圖片與字體載入完成後，輸出四張 2× PNG 到 `assets/generated/`：

- `profile-desktop-light.png` / `profile-desktop-dark.png`：1040px 寬的桌面排版。
- `profile-mobile-light.png` / `profile-mobile-dark.png`：480px 寬的手機排版。

高度隨內容自動調整。成功後才替換正式圖片；結束時自動關閉 server 和 browser。匯出時拒絕外部資源請求，檢查字體、圖片、頁面錯誤與水平溢出；依賴裝好後可離線產圖。

## 編輯

- `profile/index.html`：姓名、About、音樂背景、News。
- `profile/site.css`：來自原網站的樣式。
- `profile/profile.css`：README 專用尺寸、間距與手機排版。
- `profile/fonts.css` 和 `profile/fonts/`：本地 Hanken Grotesk（400/500/600）、Noto Serif TC（中文姓名字元子集）及授權。改中文姓名需更新字型子集。
- `assets/`：原始照片；`assets/generated/`：匯出成品。

圖片內沒有導覽列或聯絡連結清單。README 在圖片下保留真正可點的聯絡連結和 repo cards。更新內容後，執行 `npm run export`，將原始碼與四张產圖一起提交。

README 的 `<picture>` 依深淺色與 viewport 寬度選圖；GitHub 頁面欄寬不等同 viewport 寬度。整張圖片點擊會前往 vaclis.net，圖片內文無法單獨選取或點擊。


## 自訂 repo cards（目前使用）

`cards/render.mjs` 改寫自 github-stats-extended 的 repo renderer；來源、原始檔與 MIT 授權在 `vendor/github-stats-extended/`。卡片是本機 SVG，固定 **400 × 152**，包含名稱、描述、最多一排 GitHub topics、語言、stars、forks。超過一排的 topics 顯示 `+N`；沒有 topics 的 repo 不會產生標籤，卡片仍維持相同高度。

```sh
npm run cards          # 從 GitHub 更新公開資料並產圖
npm run cards:offline  # 使用 cards/data.json，離線重畫
npm run refresh        # 同時更新上方照片與 repo cards
npm test               # 換行、標籤溢出、SVG 文字跳脫檢查
```

- `cards/repos.json`：選定的 repo。
- `cards/data.json`：僅儲存公開資料及抓取時間，不儲存 token。
- `assets/cards/`：README 實際引用的深淺色 SVG。
- 字體嵌入 SVG，不依賴外部字體請求。字體授權見 `profile/fonts/`。
- 可選擇以 `GITHUB_TOKEN` 環境變數提高 API 額度；script 不會輸出 token，且拒絕匯出 private repo。
- 更新遇到 API 錯誤就停止，保留原產圖。需要離線工作時明確使用 `cards:offline`。
- AMTFlow 依使用者要求暫緩：若仍是 404 就跳過並保留原遠端連結；公開後下次 `npm run cards` 會自動產生本地卡片並切換 README 引用。
- 這是產圖時的資料快照，GitHub 瀏覽時不會即時更新。改完 GitHub topics 後重新執行 `npm run cards` 並提交產圖即可。

卡片固定保留 description 兩行、topics 一行的空間；空內容也保留位置，統計列對齊。
