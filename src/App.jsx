import React from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard.jsx";
import StockDetail from "./pages/StockDetail.jsx";
import Portfolio from "./pages/Portfolio.jsx";
import IndustryChain from "./pages/IndustryChain.jsx";
import SegmentDetail from "./pages/SegmentDetail.jsx";
import Notifications from "./pages/Notifications.jsx";
import Settings from "./pages/Settings.jsx";
import BottomNav from "./components/BottomNav.jsx";

// 用 HashRouter 是因為部署在 GitHub Pages 這種純靜態網站上，
// 沒有伺服器可以處理「重新整理某個子頁面路徑」的請求，Hash 路由完全不需要伺服器端支援。
export default function App() {
  return (
    <HashRouter>
      <div className="app-shell">
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/stock/:code" element={<StockDetail />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/industry" element={<IndustryChain />} />
            <Route path="/industry/:chainId/:segmentId" element={<SegmentDetail />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
        <BottomNav />
      </div>
    </HashRouter>
  );
}
