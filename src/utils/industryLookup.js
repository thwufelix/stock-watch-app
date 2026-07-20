import industryData from "../data/industryChains.json";

let cachedMap = null;

export function getSegmentForCode(code) {
  if (!cachedMap) {
    cachedMap = {};
    for (const chain of industryData.chains) {
      for (const segment of chain.segments) {
        for (const company of segment.companies) {
          cachedMap[company.code] = {
            chainId: chain.id,
            chainName: chain.name,
            segmentId: segment.id,
            segmentName: segment.name,
          };
        }
      }
    }
  }
  return cachedMap[code] || null;
}

export function getIndustryChains() {
  return industryData.chains;
}

// 依股票代號在產業鏈資料庫中找公司名稱（找不到時回傳 null）
export function getCompanyName(code) {
  for (const chain of industryData.chains) {
    for (const segment of chain.segments) {
      for (const company of segment.companies) {
        if (company.code === code) return company.name;
      }
    }
  }
  return null;
}
