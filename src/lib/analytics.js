export const money = (value) => new Intl.NumberFormat("en-IN", {
  style: "currency", currency: "INR", maximumFractionDigits: 0
}).format(Number(value || 0));

export const number = (value) => new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 0
}).format(Number(value || 0));

export const percent = (value) => `${Number(value || 0).toFixed(2)}%`;

export function getMetrics(rows) {
  const sum = (key) => rows.reduce((total, row) => total + (Number(row[key]) || 0), 0);
  const spend = sum("spend");
  const revenue = sum("revenue");
  const impressions = sum("impressions");
  const clicks = sum("clicks");
  const conversions = sum("conversions");
  const reach = sum("reach");
  return {
    spend, revenue, impressions, clicks, conversions, reach,
    roas: spend > 0 ? revenue / spend : null,
    ctr: impressions > 0 ? clicks / impressions * 100 : null,
    cpc: clicks > 0 ? spend / clicks : null,
    cpm: impressions > 0 ? spend / impressions * 1000 : null,
    cpa: conversions > 0 ? spend / conversions : null
  };
}

export function groupByCategory(rows) {
  const map = new Map();
  for (const row of rows) {
    const key = row.category || "Other / Needs Review";
    if (!map.has(key)) map.set(key, { category: key, spend: 0, revenue: 0, conversions: 0, reach: 0, clicks: 0 });
    const item = map.get(key);
    for (const metric of ["spend", "revenue", "conversions", "reach", "clicks"]) item[metric] += Number(row[metric]) || 0;
  }
  return [...map.values()];
}
