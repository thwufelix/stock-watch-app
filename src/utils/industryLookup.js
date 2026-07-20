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
