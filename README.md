# 小組活動綜合平台

嘉年華風格的小組活動工具網站。第一階段包含：

- 抽獎輪盤：動畫抽選、出席／任務／積分條件、避免重複抽中、參加者管理
- 多項選擇遊戲：倒數計時、即時計分、連勝、結果頁、題目／選項隨機排列
- 題庫管理：逐題新增、批量文字輸入、Excel／CSV 匯入、題庫匯出
- 響應式版面：支援電腦、平板及手機
- 瀏覽器本機儲存：重新開啟頁面仍可保留題庫及設定

## 技術架構

此版本採用純 HTML、CSS 及 JavaScript，不需要安裝套件或執行建置，因此可以直接放到 GitHub，並部署至 Vercel 或 GitHub Pages。

Excel 讀取使用 SheetJS CE 官方瀏覽器版本：

`https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js`

若外部程式庫因網絡政策無法載入，CSV、批量文字輸入及逐題新增仍可使用。

## 本機預覽

在專案資料夾執行：

```bash
python -m http.server 8000
```

然後打開：

```text
http://localhost:8000
```

## 題庫 Excel 欄位

必要欄位：

| 題目 | 選項A | 選項B | 選項C | 選項D | 正確答案 |
|---|---|---|---|---|---|

可選欄位：`分數`、`解說`

正確答案可填：`A / B / C / D`、`1 / 2 / 3 / 4`，或完整選項文字。

## 批量輸入格式

每行一題，以 `|` 或 Tab 分隔：

```text
題目 | 選項A | 選項B | 選項C | 選項D | 正確答案 | 分數 | 解說
香港最高的山峰？ | 太平山 | 大帽山 | 獅子山 | 鳳凰山 | B | 100 | 大帽山是香港最高峰
```

## 部署到 GitHub

1. 在 GitHub 建立新的 repository。
2. 將本資料夾所有檔案上載至 repository 根目錄。
3. 如要使用 GitHub Pages：到 **Settings → Pages → Source** 選擇 **GitHub Actions**。
4. 專案已包含 `.github/workflows/pages.yml`，推送到 `main` 後會自動部署。

## 部署到 Vercel

1. 登入 Vercel。
2. 選擇 **Add New → Project**，匯入 GitHub repository。
3. Framework Preset 選擇 **Other**。
4. Build Command 留空，Output Directory 留空或使用 `.`。
5. 按 Deploy。

此網站使用 hash route（例如 `#wheel`、`#quiz`），因此在靜態部署環境毋須額外設定路由 rewrite。

## 後續可擴充

- Supabase 帳戶及雲端同步
- 多房間即時答題
- QR Code 加入遊戲
- 管理員／參加者分離介面
- 排行榜及活動報告
- 圖片題、拼圖題、排序題
