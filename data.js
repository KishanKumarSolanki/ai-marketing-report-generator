// Editable demo data for testing the dashboard before uploading a real CSV.
// All figures are fictional sample data and should not be presented as client results.
export const sampleClients = [
  { id: "apex", name: "Apex Retail India", industry: "E-Commerce Fashion", status: "Active" },
  { id: "zest", name: "Zest Living Real Estate", industry: "Real Estate & Properties", status: "Active" }
];

export const sampleCampaigns = [
  { id: "c1", clientId: "apex", campaignName: "Diwali Festive Sales Promo", platform: "Meta Ads", objective: "Sales", category: "Performance Marketing", spend: 85000, revenue: 384000, impressions: 520000, reach: 310000, clicks: 14200, conversions: 480, month: "2026-10" },
  { id: "c2", clientId: "apex", campaignName: "Brand Awareness - Pan India", platform: "Meta Ads", objective: "Awareness", category: "Brand Awareness", spend: 25000, revenue: 0, impressions: 410000, reach: 280000, clicks: 3100, conversions: 0, month: "2026-10" },
  { id: "c3", clientId: "apex", campaignName: "Lead Gen - VIP Club", platform: "Meta Ads", objective: "Leads", category: "Performance Marketing", spend: 35000, revenue: 0, impressions: 180000, reach: 120000, clicks: 6400, conversions: 320, month: "2026-10" },
  { id: "c4", clientId: "apex", campaignName: "Instagram Reels - Styling Tips", platform: "Instagram", objective: "Engagement", category: "Social Media", spend: 10000, revenue: 0, impressions: 0, reach: 92000, clicks: 2100, conversions: 0, month: "2026-10" },
  { id: "c5", clientId: "apex", campaignName: "SEO Category Pages", platform: "Website", objective: "Traffic", category: "SEO", spend: 15000, revenue: 0, impressions: 0, reach: 0, clicks: 1800, conversions: 35, month: "2026-10" },
  { id: "c6", clientId: "apex", campaignName: "September Retargeting", platform: "Meta Ads", objective: "Sales", category: "Performance Marketing", spend: 92000, revenue: 292500, impressions: 480000, reach: 290000, clicks: 12000, conversions: 390, month: "2026-09" },
  { id: "c7", clientId: "zest", campaignName: "Luxury Apartment Leads", platform: "Google Ads", objective: "Leads", category: "Performance Marketing", spend: 68000, revenue: 0, impressions: 205000, reach: 120000, clicks: 8300, conversions: 210, month: "2026-10" },
  { id: "c8", clientId: "zest", campaignName: "Property Walkthrough Reels", platform: "Instagram", objective: "Engagement", category: "Social Media", spend: 18000, revenue: 0, impressions: 0, reach: 54000, clicks: 1200, conversions: 0, month: "2026-10" }
];

export const categoryOptions = [
  "Social Media",
  "Performance Marketing",
  "Digital Marketing",
  "SEO",
  "Content Marketing",
  "Email Marketing",
  "Brand Awareness",
  "Other / Needs Review"
];
