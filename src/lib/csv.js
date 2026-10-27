import Papa from "papaparse";

const aliases = {
  campaignName: ["campaign", "campaign name", "ad set name", "ad name", "name"],
  platform: ["platform", "source", "channel", "publisher platform"],
  objective: ["objective", "campaign objective", "goal"],
  category: ["category", "marketing category", "channel category"],
  spend: ["spend", "amount spent", "cost", "ad spend", "budget spent"],
  revenue: ["revenue", "purchase conversion value", "conversion value", "sales"],
  impressions: ["impressions", "impr."],
  reach: ["reach"],
  clicks: ["clicks", "link clicks", "outbound clicks"],
  conversions: ["conversions", "results", "purchases", "leads"],
  month: ["month", "reporting month", "date", "report date"]
};

const normalizeHeader = (value) => String(value || "").trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");

export function parseCsvText(text) {
  const result = Papa.parse(text, { header: true, skipEmptyLines: "greedy", transformHeader: h => h.trim() });
  if (result.errors?.length && !result.data?.length) throw new Error(result.errors[0].message);
  if (!result.meta.fields?.length) throw new Error("CSV header row was not found.");
  const headers = result.meta.fields;
  const mapping = {};
  for (const [field, choices] of Object.entries(aliases)) {
    const match = headers.find(header => choices.includes(normalizeHeader(header)));
    if (match) mapping[field] = match;
  }
  if (!mapping.campaignName) throw new Error("Campaign name column was not detected. Rename a column to Campaign or Campaign Name.");
  const rows = result.data.map((raw, index) => {
    const out = { id: `upload-${Date.now()}-${index}` };
    for (const [field, header] of Object.entries(mapping)) {
      let value = raw[header];
      if (["spend", "revenue", "impressions", "reach", "clicks", "conversions"].includes(field)) {
        const parsed = Number(String(value ?? "").replace(/[₹,\s]/g, ""));
        out[field] = value === "" || value == null ? null : (Number.isFinite(parsed) ? parsed : null);
      } else {
        out[field] = String(value ?? "").trim();
      }
    }
    out.campaignName = out.campaignName || `Campaign ${index + 1}`;
    out.platform = out.platform || "Unknown";
    out.objective = out.objective || "";
    out.category = out.category || "Other / Needs Review";
    out.month = normalizeMonth(out.month);
    return out;
  }).filter(row => row.campaignName);
  return { rows, headers, mapping, errors: result.errors || [] };
}

function normalizeMonth(value) {
  if (!value) return new Date().toISOString().slice(0, 7);
  const s = String(value).trim();
  if (/^\d{4}-\d{2}/.test(s)) return s.slice(0, 7);
  const date = new Date(s);
  if (!Number.isNaN(date.getTime())) return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  return new Date().toISOString().slice(0, 7);
}

export function toCsv(rows) {
  return Papa.unparse(rows.map(row => ({
    campaign_name: row.campaignName,
    platform: row.platform,
    objective: row.objective,
    category: row.category,
    spend_inr: row.spend ?? "",
    revenue_inr: row.revenue ?? "",
    impressions: row.impressions ?? "",
    reach: row.reach ?? "",
    clicks: row.clicks ?? "",
    conversions: row.conversions ?? "",
    reporting_month: row.month
  })));
}
