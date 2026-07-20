import React from "react";
import { useParams, Link } from "react-router-dom";
import { getIndustryChains } from "../utils/industryLookup.js";

// 單一產業鏈環節的詳細頁：說明這個環節在做什麼、
// 上下游各是誰（可直接點過去）、有哪些代表公司（可點進個股頁）。
export default function SegmentDetail() {
  const { chainId, segmentId } = useParams();
  const chains = getIndustryChains();
  const chain = chains.find((c) => c.id === chainId);
  const index = chain?.segments.findIndex((s) => s.id === segmentId) ?? -1;
  const segment = index >= 0 ? chain.segments[index] : null;

  if (!chain || !segment) {
    return <div className="empty-state">找不到這個產業鏈環節。</div>;
  }

  const upstream = index > 0 ? chain.segments[index - 1] : null;
  const downstream = index < chain.segments.length - 1 ? chain.segments[index + 1] : null;

  return (
    <div>
      <Link to="/industry" className="btn" style={{ display: "inline-block", marginBottom: 12 }}>
        ← 回產業鏈總覽
      </Link>

      <h1>{segment.name}</h1>
      <p className="subtitle">
        {chain.name} · 第 {index + 1} 個環節（共 {chain.segments.length} 個）
      </p>

      <h2>這個環節在做什麼</h2>
      <div className="card">
        <p className="reason-text" style={{ marginTop: 0 }}>{segment.description}</p>
      </div>

      <h2>上下游關係</h2>
      <div className="card">
        {upstream ? (
          <Link to={`/industry/${chain.id}/${upstream.id}`}>
            <div className="neighbor-row">
              <span className="neighbor-label">⬆️ 上游</span>
              <span>{upstream.name}</span>
            </div>
          </Link>
        ) : (
          <div className="neighbor-row">
            <span className="neighbor-label">⬆️ 上游</span>
            <span className="reason-text">這裡就是整條產業鏈的最上游</span>
          </div>
        )}
        {downstream ? (
          <Link to={`/industry/${chain.id}/${downstream.id}`}>
            <div className="neighbor-row">
              <span className="neighbor-label">⬇️ 下游</span>
              <span>{downstream.name}</span>
            </div>
          </Link>
        ) : (
          <div className="neighbor-row">
            <span className="neighbor-label">⬇️ 下游</span>
            <span className="reason-text">這裡就是整條產業鏈的最下游</span>
          </div>
        )}
      </div>

      <h2>代表公司</h2>
      <div className="card">
        <div className="chip-row">
          {segment.companies.map((c) => (
            <Link key={c.code} to={`/stock/${c.code}`}>
              <span className="chip">
                {c.name} {c.code}
              </span>
            </Link>
          ))}
        </div>
        <p className="reason-text">點任一家公司可以看它的風險燈號、走向與相關新聞。</p>
      </div>
    </div>
  );
}
