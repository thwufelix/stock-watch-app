import React, { useState } from "react";
import { Link } from "react-router-dom";
import { getIndustryChains } from "../utils/industryLookup.js";

// 產業鏈總覽：把每個分工環節畫成由上游到下游的流程卡片，
// 點任一環節卡片會進入該環節的詳細頁（SegmentDetail）。
export default function IndustryChain() {
  const chains = getIndustryChains();
  const [activeChainId, setActiveChainId] = useState(chains[0]?.id);
  const activeChain = chains.find((c) => c.id === activeChainId);

  return (
    <div>
      <h1>產業鏈分工</h1>
      <p className="subtitle">
        由上而下就是產業的上游到下游。點任一個環節，可以看到這個環節在做什麼、有哪些代表公司。
      </p>

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

          <div className="flow-wrap">
            {activeChain.segments.map((segment, i) => (
              <React.Fragment key={segment.id}>
                <Link to={`/industry/${activeChain.id}/${segment.id}`}>
                  <div className="flow-card">
                    <div className="flow-card-head">
                      <span className="flow-step">{i + 1}</span>
                      <span className="flow-name">{segment.name}</span>
                      <span className="flow-count">{segment.companies.length} 家</span>
                    </div>
                    <span className="flow-more">看這個環節的分工與公司 →</span>
                  </div>
                </Link>
                {i < activeChain.segments.length - 1 && <div className="flow-arrow">▼</div>}
              </React.Fragment>
            ))}
          </div>
        </>
      )}

      <p className="disclaimer">
        產業鏈分工資料為公開常識性整理，僅供教育與示意用途，實際業務分工可能隨公司策略調整，
        請以個別公司最新公開資訊為準。
      </p>
    </div>
  );
}
