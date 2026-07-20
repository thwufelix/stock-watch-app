import React, { useState } from "react";
import { Link } from "react-router-dom";
import { getIndustryChains } from "../utils/industryLookup.js";
import { getHoldings } from "../utils/storage.js";

export default function IndustryChain() {
  const chains = getIndustryChains();
  const [activeChainId, setActiveChainId] = useState(chains[0]?.id);
  const holdings = getHoldings();
  const holdingCodes = new Set(holdings.map((h) => h.code));

  const activeChain = chains.find((c) => c.id === activeChainId);

  return (
    <div>
      <h1>產業鏈分工</h1>
      <p className="subtitle">了解一檔股票在整條產業鏈裡屬於哪個環節，比單看股價更容易判斷景氣輪動。</p>

      <div className="chip-row" style={{ marginBottom: 16 }}>
        {chains.map((c) => (
          <button
            key={c.id}
            className={c.id === activeChainId ? "primary" : ""}
            onClick={() => setActiveChainId(c.id)}
          >
            {c.name}
          </button>
        ))}
      </div>

      {activeChain && (
        <>
          <p className="subtitle">{activeChain.description}</p>
          {activeChain.segments.map((segment) => (
            <div className="segment-block" key={segment.id}>
              <h2 style={{ margin: "0 0 4px 0" }}>{segment.name}</h2>
              <p className="reason-text" style={{ marginTop: 0 }}>{segment.description}</p>
              <div className="chip-row">
                {segment.companies.map((c) => (
                  <Link key={c.code} to={`/stock/${c.code}`}>
                    <span className={`chip ${holdingCodes.has(c.code) ? "in-watchlist" : ""}`}>
                      {c.name} {c.code}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </>
      )}

      <p className="disclaimer">
        產業鏈分工資料為公開常識性整理，僅供教育與示意用途，實際業務分工可能隨公司策略調整，
        請以個別公司最新公開資訊為準。
      </p>
    </div>
  );
}
