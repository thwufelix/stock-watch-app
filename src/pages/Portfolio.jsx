import React, { useEffect, useMemo, useState } from "react";
import RiskBadge from "../components/RiskBadge.jsx";
import { getHoldings, saveHoldings } from "../utils/storage.js";
import { getSegmentForCode } from "../utils/industryLookup.js";
import { assessConcentrationRisk, combinePortfolioRisk } from "../utils/riskEngine.js";
import { loadDashboard } from "../utils/dataClient.js";

export default function Portfolio() {
  const [holdings, setHoldings] = useState([]);
  const [dashboard, setDashboard] = useState(null);

  useEffect(() => {
    setHoldings(getHoldings());
    loadDashboard().then(setDashboard);
  }, []);

  function updateHolding(index, field, value) {
    const next = [...holdings];
    next[index] = { ...next[index], [field]: value };
    setHoldings(next);
    saveHoldings(next);
  }

  function addHolding() {
    const next = [...holdings, { code: "", weightPct: 0 }];
    setHoldings(next);
    saveHoldings(next);
  }

  function removeHolding(index) {
    const next = holdings.filter((_, i) => i !== index);
    setHoldings(next);
    saveHoldings(next);
  }

  const totalWeight = useMemo(
    () => holdings.reduce((a, h) => a + (parseFloat(h.weightPct) || 0), 0),
    [holdings]
  );

  const analysis = useMemo(() => {
    if (!dashboard) return null;
    const valid = holdings.filter((h) => h.code && parseFloat(h.weightPct) > 0);
    if (valid.length === 0) return null;

    const enriched = valid.map((h) => {
      const segment = getSegmentForCode(h.code);
      const stockInfo = dashboard.stocks.find((s) => s.code === h.code);
      return {
        code: h.code,
        weightPct: parseFloat(h.weightPct) || 0,
        segmentId: segment?.segmentId || "unknown",
        segmentName: segment?.segmentName || "未分類（不在產業鏈資料庫中）",
        riskTier: stockInfo?.riskTier || "unknown",
        name: stockInfo?.name || h.code,
      };
    });

    const concentration = assessConcentrationRisk(enriched);
    const overallTier = combinePortfolioRisk(
      enriched.map((h) => h.riskTier),
      concentration.tier
    );

    return { enriched, concentration, overallTier };
  }, [holdings, dashboard]);

  return (
    <div>
      <h1>投資組合風險</h1>
      <p className="subtitle">
        輸入你持有的股票代號與大概佔比（%），就能看到整體組合的風險評估，資料只存在你自己的手機裡。
      </p>

      <div className="card">
        {holdings.map((h, i) => (
          <div className="holding-row" key={i}>
            <input
              type="text"
              placeholder="股票代號，如 2330"
              value={h.code}
              onChange={(e) => updateHolding(i, "code", e.target.value.trim())}
            />
            <input
              type="number"
              placeholder="佔比%"
              value={h.weightPct}
              onChange={(e) => updateHolding(i, "weightPct", e.target.value)}
            />
            <button onClick={() => removeHolding(i)} aria-label="刪除">
              ✕
            </button>
          </div>
        ))}
        <button onClick={addHolding} style={{ width: "100%", marginTop: 4 }}>
          + 新增持股
        </button>
        <p className="reason-text">目前合計佔比：{totalWeight.toFixed(0)}%（不需要剛好等於 100%，僅用來計算相對比重）</p>
      </div>

      {analysis && (
        <>
          <h2>整體風險</h2>
          <div className="card gauge-wrap">
            <RiskBadge tier={analysis.overallTier} size="large" />
          </div>

          <h2>集中度分析</h2>
          <div className="card">
            <p className="reason-text">{analysis.concentration.reason}</p>
          </div>

          <h2>持股分工明細</h2>
          <div className="card">
            {analysis.enriched.map((h) => (
              <div className="card-row" key={h.code} style={{ marginBottom: 8 }}>
                <span>
                  {h.name} <span className="stock-code">{h.code}</span>
                </span>
                <span className="tag">
                  {h.segmentName} · {h.weightPct}%
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {!analysis && (
        <div className="empty-state">加入至少一筆持股，就能看到組合風險分析。</div>
      )}

      <p className="disclaimer">
        本頁風險評估綜合「個股波動」與「產業鏈集中度」兩項因素，屬簡化版統計判斷，
        並未涵蓋槓桿、匯率、總經等其他風險來源，僅供參考，不構成投資建議。
      </p>
    </div>
  );
}
