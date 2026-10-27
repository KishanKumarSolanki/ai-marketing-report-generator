export async function categorizeCampaigns(rows) {
  const response = await fetch("/api/categorize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      campaigns: rows.map(({ id, campaignName, platform, objective, category }) => ({
        id, campaignName, platform, objective, category
      }))
    })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "AI categorization failed.");
  return data;
}

export async function generateInsights(summary) {
  const response = await fetch("/api/insights", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ summary })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Insight generation failed.");
  return data;
}
