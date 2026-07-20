import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// 部署到 GitHub Pages 時，網址會是 https://<你的帳號>.github.io/<repo名稱>/
// 請把下面 base 改成你的 repo 名稱（前後要有斜線），例如 "/stock-watch-app/"
// 若使用自訂網域或本機測試，可以維持 "/"
const REPO_BASE = process.env.VITE_BASE_PATH || "/";

export default defineConfig({
  base: REPO_BASE,
  plugins: [react()],
  build: {
    outDir: "dist",
  },
});
