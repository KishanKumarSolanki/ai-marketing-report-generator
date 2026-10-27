import React, { useMemo, useRef, useState } from "react";
import {
  Activity, ArrowDownRight, ArrowUpRight, BarChart3, CalendarDays, Check,
  ChevronDown, CircleHelp, Download, FileSpreadsheet, FileText, FolderKanban,
  Gauge, Instagram, LayoutDashboard, LoaderCircle, Menu, Plus, Search,
  Settings2, ShieldCheck, Sparkles, Target, TrendingUp, Upload, Users,
  WandSparkles, X, Zap, Facebook, RefreshCw, BrainCircuit
} from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis
} from "recharts";
import { sampleCampaigns, sampleClients, categoryOptions } from "../data.js";
import { getMetrics, groupByCategory, money, number, percent } from "./lib/analytics.js";
import { parseCsvText } from "./lib/csv.js";
import { categorizeCampaigns, generateInsights } from "./lib/ai.js";
import { exportCsv, exportPdf, exportPptx } from "./lib/exporters.js";

const navItems = [
  { id: "dashboard", label: "Executive Dashboard", icon: LayoutDashboard },
  { id: "ads", label: "Performance Marketing", icon: Target },
  { id: "social", label: "Social Media Organic", icon: Instagram },
  { id: "comparison", label: "MoM Comparison", icon: TrendingUp },
  { id: "upload", label: "CSV Upload & Data", icon: FileSpreadsheet },
  { id: "clients", label: "Client Manager", icon: Users },
  { id: "reports", label: "Reports & Exports", icon: FileText }
];
const COLORS = ["#7064ff", "#c14aff", "#ed3e98", "#48d597", "#f5b942", "#42b5ee", "#9d9dbb"];
const initialMonth = "2026-10";
const formatMonth = (month) => {
  const [year, m] = month.split("-");
  return new Date(Number(year), Number(m) - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
};
const uid = () => `client-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

function MetricCard({ label, value, detail, icon: Icon, color = "purple", trend }) {
  const colorClass = { purple: "text-brand-300", green: "text-mint", pink: "text-pink-300", blue: "text-sky-300" }[color] || "text-brand-300";
  return <div className="metric-card">
    <div className="flex items-start justify-between gap-3">
      <p className="metric-label">{label}</p>
      {Icon && <span className={`metric-icon ${colorClass}`}><Icon size={17} /></span>}
    </div>
    <div className="mt-3 flex flex-wrap items-baseline gap-2">
      <p className="metric-value">{value}</p>
      {trend && <span className="inline-flex items-center gap-1 text-xs font-semibold text-mint"><ArrowUpRight size={14}/>{trend}</span>}
    </div>
    {detail && <p className="mt-2 text-xs text-slate-400">{detail}</p>}
  </div>;
}

function SectionTitle({ title, subtitle, action }) {
  return <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
    <div><h2 className="text-xl font-bold tracking-tight text-white md:text-2xl">{title}</h2><p className="mt-1 text-sm text-slate-400">{subtitle}</p></div>
    {action}
  </div>;
}

function EmptyState({ icon: Icon = FileSpreadsheet, title, description }) {
  return <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed border-line p-8 text-center">
    <div className="mb-3 rounded-2xl bg-brand/15 p-3 text-brand-300"><Icon size={24}/></div>
    <h3 className="font-semibold text-white">{title}</h3><p className="mt-1 max-w-md text-sm text-slate-400">{description}</p>
  </div>;
}

export default function App() {
  const [clients, setClients] = useState(sampleClients);
  const [clientId, setClientId] = useState("apex");
  const [month, setMonth] = useState(initialMonth);
  const [campaigns, setCampaigns] = useState(sampleCampaigns);
  const [page, setPage] = useState("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");
  const [aiMode, setAiMode] = useState("Not checked");
  const [insights, setInsights] = useState([]);
  const [newClientName, setNewClientName] = useState("");
  const [newClientIndustry, setNewClientIndustry] = useState("Digital Marketing");
  const [showAddClient, setShowAddClient] = useState(false);
  const [uploadSummary, setUploadSummary] = useState(null);
  const fileRef = useRef(null);

  const activeClient = clients.find(c => c.id === clientId) || clients[0];
  const clientCampaigns = useMemo(() => campaigns.filter(c => c.clientId === clientId), [campaigns, clientId]);
  const currentRows = useMemo(() => clientCampaigns.filter(c => c.month === month), [clientCampaigns, month]);
  const previousMonth = useMemo(() => {
    const [y, m] = month.split("-").map(Number);
    const date = new Date(y, m - 2, 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }, [month]);
  const previousRows = useMemo(() => clientCampaigns.filter(c => c.month === previousMonth), [clientCampaigns, previousMonth]);
  const metrics = useMemo(() => getMetrics(currentRows), [currentRows]);
  const previousMetrics = useMemo(() => getMetrics(previousRows), [previousRows]);
  const categories = useMemo(() => groupByCategory(currentRows), [currentRows]);
  const visibleRows = useMemo(() => currentRows.filter(r => `${r.campaignName} ${r.category} ${r.platform} ${r.objective}`.toLowerCase().includes(search.toLowerCase())), [currentRows, search]);
  const hasData = currentRows.length > 0;

  const changePage = (id) => { setPage(id); setMobileOpen(false); setSearch(""); };
  const flash = (message) => { setNotice(message); window.setTimeout(() => setNotice(""), 4500); };

  async function handleUpload(file) {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) return flash("Please upload a .csv file.");
    if (file.size > 10 * 1024 * 1024) return flash("File is larger than 10 MB. Please upload a smaller CSV.");
    setBusy("upload");
    try {
      const text = await file.text();
      const parsed = parseCsvText(text);
      if (!parsed.rows.length) throw new Error("No campaign rows found in the CSV.");
      const imported = parsed.rows.map(row => ({ ...row, clientId, month: row.month || month }));
      setCampaigns(old => [...old.filter(r => !(r.clientId === clientId && r.month === month && r.id.startsWith("upload-"))), ...imported]);
      setMonth(imported[0]?.month || month);
      setUploadSummary({ fileName: file.name, count: imported.length, mapping: parsed.mapping, errors: parsed.errors.length });
      setInsights([]);
      flash(`Imported ${imported.length} rows from ${file.name}. Review the detected columns below.`);
    } catch (error) {
      flash(error.message || "Could not read the CSV.");
    } finally {
      setBusy("");
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleCategorize() {
    if (!currentRows.length) return flash("No campaign data for this client and month.");
    setBusy("categorize");
    try {
      const result = await categorizeCampaigns(currentRows);
      const resultMap = new Map(result.results.map(r => [r.id, r]));
      setCampaigns(old => old.map(row => {
        const found = row.clientId === clientId && row.month === month ? resultMap.get(row.id) : null;
        return found ? { ...row, category: found.category, aiConfidence: found.confidence, aiReason: found.reason } : row;
      }));
      setAiMode(result.mode === "openai" ? "OpenAI connected" : "Demo fallback");
      if (result.note) flash(result.note);
      else flash(`AI categorized ${result.results.length} campaigns. Review suggestions before final reporting.`);
    } catch (error) { flash(error.message); }
    finally { setBusy(""); }
  }

  async function handleInsights() {
    if (!hasData) return flash("No campaign data for this reporting month.");
    setBusy("insights");
    try {
      const result = await generateInsights({
        clientName: activeClient.name, month, spend: metrics.spend, revenue: metrics.revenue,
        conversions: metrics.conversions, reach: metrics.reach, roas: metrics.roas, ctr: metrics.ctr,
        categories: categories.map(({ category, spend, revenue, conversions }) => ({ category, spend, revenue, conversions }))
      });
      setInsights(result.insights);
      setAiMode(result.mode === "openai" ? "OpenAI connected" : "Demo fallback");
      if (result.mode === "demo-fallback") flash("Demo insights shown. Add OPENAI_API_KEY to enable live AI.");
    } catch (error) { flash(error.message); }
    finally { setBusy(""); }
  }

  function setRowCategory(id, category) {
    setCampaigns(old => old.map(row => row.id === id ? { ...row, category } : row));
  }

  function addClient(e) {
    e.preventDefault();
    if (!newClientName.trim()) return;
    const client = { id: uid(), name: newClientName.trim(), industry: newClientIndustry, status: "Active" };
    setClients(old => [...old, client]);
    setClientId(client.id);
    setNewClientName("");
    setShowAddClient(false);
    flash(`Added ${client.name}. Upload data to start a report.`);
    changePage("clients");
  }

  const exportActions = {
    pdf: () => hasData ? exportPdf(currentRows, activeClient.name, month, insights) : flash("No data to export."),
    pptx: () => hasData ? exportPptx(currentRows, activeClient.name, month, insights).catch(() => flash("PowerPoint export failed.")) : flash("No data to export."),
    csv: () => hasData ? exportCsv(currentRows, activeClient.name, month) : flash("No data to export.")
  };

  const chartRows = categories.map(c => ({ ...c, shortCategory: c.category.length > 17 ? c.category.slice(0, 15) + "…" : c.category }));
  const trendRows = [
    { month: formatMonth(previousMonth).split(" ")[0].slice(0, 3), spend: previousMetrics.spend, revenue: previousMetrics.revenue },
    { month: formatMonth(month).split(" ")[0].slice(0, 3), spend: metrics.spend, revenue: metrics.revenue }
  ];

  const sidebar = <aside className={`${mobileOpen ? "mobile-sidebar fixed inset-y-0 left-0 z-50 flex w-72 flex-col" : "hidden"} sidebar lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:shrink-0 lg:flex-col`}>
    <div className="flex h-[88px] items-center gap-3 border-b border-line px-5">
      <div className="grid h-11 w-11 place-items-center rounded-2xl bg-brand shadow-glow"><BarChart3 size={23} className="text-white"/></div>
      <div><div className="font-bold tracking-tight text-white">Report Studio</div><div className="text-xs text-slate-400">AI Marketing Intelligence</div></div>
      <button className="ml-auto text-slate-400 lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X size={20}/></button>
    </div>
    <div className="border-b border-line p-4">
      <label className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-slate-400">Active client</label>
      <div className="relative">
        <select className="field w-full appearance-none pr-8" value={clientId} onChange={e => setClientId(e.target.value)}>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select><ChevronDown className="pointer-events-none absolute right-3 top-3 text-slate-400" size={15}/>
      </div>
      <label className="mb-2 mt-4 block text-[11px] font-bold uppercase tracking-widest text-slate-400">Reporting month</label>
      <div className="relative"><CalendarDays size={15} className="absolute left-3 top-3 text-slate-400"/><input className="field w-full pl-9" type="month" value={month} onChange={e => setMonth(e.target.value)}/></div>
    </div>
    <nav className="flex-1 space-y-1 overflow-y-auto p-3">
      {navItems.map(item => {
        const Icon = item.icon;
        return <button key={item.id} onClick={() => changePage(item.id)} className={`nav-item ${page === item.id ? "nav-item-active" : ""}`}>
          <Icon size={17}/><span>{item.label}</span>
        </button>;
      })}
    </nav>
    <div className="border-t border-line p-4">
      <div className="mb-3 flex items-center gap-2 text-xs text-slate-400"><span className={`h-2 w-2 rounded-full ${aiMode === "OpenAI connected" ? "bg-mint" : "bg-amber-400"}`}/>{aiMode === "OpenAI connected" ? "OpenAI connected" : "AI setup: check server"}</div>
      <button onClick={() => changePage("reports")} className="btn-secondary w-full"><Download size={15}/> Download report</button>
      <p className="mt-3 text-[10px] leading-4 text-slate-500">Demo data is fictional. Verify imported metrics before sharing.</p>
    </div>
  </aside>;

  return <div className="min-h-screen bg-ink text-slate-100 lg:flex">
    {sidebar}
    {mobileOpen && <button className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close navigation"/>}
    <main className="min-w-0 flex-1">
      <header className="mobile-header topbar sticky top-0 z-30 flex min-h-[72px] flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-7">
        <div className="flex items-center gap-3">
          <button className="icon-btn lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu size={19}/></button>
          <div className="hidden items-center gap-2 rounded-full border border-brand/40 bg-brand/10 px-3 py-1.5 text-xs font-medium text-brand-200 sm:flex"><span className="h-1.5 w-1.5 rounded-full bg-brand-300"/>{activeClient?.name || "No client"}</div>
          <div className="rounded-full border border-line bg-panel2 px-3 py-1.5 text-xs text-slate-300">{formatMonth(month)}</div>
        </div>
        <div className="mobile-header-actions flex flex-wrap items-center gap-2">
          <button className="btn-secondary !py-2 !text-xs" onClick={exportActions.csv}><FileSpreadsheet size={15}/> Export CSV</button>
          <button className="btn-primary !py-2 !text-xs" onClick={() => changePage("upload")}><Upload size={15}/> Upload data</button>
        </div>
      </header>

      <div className="mobile-page-content mx-auto max-w-[1600px] p-4 md:p-7">
        {notice && <div className="mb-5 flex items-start gap-2 rounded-xl border border-brand/40 bg-brand/10 px-4 py-3 text-sm text-brand-100"><CircleHelp size={17} className="mt-0.5 shrink-0"/><span>{notice}</span><button className="ml-auto" onClick={() => setNotice("")}><X size={16}/></button></div>}

        {page === "dashboard" && <>
          <div className="hero-panel mb-6 flex flex-wrap items-center justify-between gap-5 p-6 md:p-7">
            <div><div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-violet-200"><Sparkles size={13}/> Monthly marketing intelligence</div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white md:text-3xl">{activeClient?.name} — Marketing Summary</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-300">Paid performance and organic social data in one report. Upload your own CSV to replace or extend sample data.</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/15 px-5 py-4"><p className="text-xs uppercase tracking-wide text-slate-400">Total investment</p><p className="mt-1 text-2xl font-extrabold text-mint">{money(metrics.spend)}</p></div>
          </div>
          {!hasData && <div className="mb-5"><EmptyState title="No data for this month" description="Upload a CSV or switch the reporting month to a month containing sample data."/></div>}
          <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            <MetricCard label="Total Ad Spend" value={money(metrics.spend)} detail={hasData ? `${number(metrics.impressions)} impressions tracked` : "No records"} icon={Gauge} color="purple"/>
            <MetricCard label="Revenue / ROAS" value={money(metrics.revenue)} detail={metrics.roas == null ? "ROAS unavailable" : `${metrics.roas.toFixed(2)}x blended ROAS`} icon={TrendingUp} color="green"/>
            <MetricCard label="Paid Conversions" value={number(metrics.conversions)} detail={metrics.cpa == null ? "CPA unavailable" : `Avg. CPA ${money(metrics.cpa)}`} icon={Target} color="blue"/>
            <MetricCard label="Total Reach" value={number(metrics.reach)} detail={`${number(metrics.clicks)} clicks`} icon={Activity} color="pink"/>
          </div>
          <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            <MetricCard label="Average CPM" value={metrics.cpm == null ? "N/A" : money(metrics.cpm)} icon={BarChart3}/>
            <MetricCard label="Average CPC" value={metrics.cpc == null ? "N/A" : money(metrics.cpc)} icon={Target} color="green"/>
            <MetricCard label="Average CTR" value={metrics.ctr == null ? "N/A" : percent(metrics.ctr)} icon={Activity} color="blue"/>
            <MetricCard label="Campaigns" value={number(currentRows.length)} detail={`${number(categories.length)} categories`} icon={FolderKanban} color="pink"/>
          </div>
          <div className="mb-6 grid grid-cols-1 gap-5 xl:grid-cols-2">
            <div className="panel p-5">
              <div className="mb-5 flex items-center justify-between"><div><h3 className="font-bold text-white">Spend vs Revenue</h3><p className="mt-1 text-xs text-slate-400">Reporting period comparison</p></div><BarChart3 className="text-brand-300" size={18}/></div>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%"><BarChart data={trendRows} barGap={8}><CartesianGrid stroke="#30314c" strokeDasharray="3 3" vertical={false}/><XAxis dataKey="month" stroke="#9294b4" tickLine={false} axisLine={false}/><YAxis stroke="#9294b4" tickLine={false} axisLine={false} tickFormatter={v => v >= 1000 ? `${Math.round(v/1000)}k` : v}/><Tooltip contentStyle={{background:"#17172d",border:"1px solid #30314c",borderRadius:12}} formatter={v => money(v)}/><Legend/><Bar dataKey="spend" name="Spend" fill="#7064ff" radius={[5,5,0,0]}/><Bar dataKey="revenue" name="Revenue" fill="#48d597" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer>
              </div>
            </div>
            <div className="panel p-5">
              <div className="mb-5 flex items-center justify-between"><div><h3 className="font-bold text-white">Category Distribution</h3><p className="mt-1 text-xs text-slate-400">Spend by marketing category</p></div><Activity className="text-brand-300" size={18}/></div>
              {categories.length ? <div className="grid grid-cols-1 items-center gap-3 md:grid-cols-[1.15fr_1fr]">
                <div className="h-[270px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={categories} dataKey="spend" nameKey="category" innerRadius={63} outerRadius={103} paddingAngle={3} stroke="#17172d" strokeWidth={3}>{categories.map((c, i) => <Cell key={c.category} fill={COLORS[i % COLORS.length]}/>)}</Pie><Tooltip contentStyle={{background:"#17172d",border:"1px solid #30314c",borderRadius:12}} formatter={v => money(v)}/></PieChart></ResponsiveContainer></div>
                <div className="space-y-3">{categories.map((c, i) => <div key={c.category} className="flex items-center justify-between gap-2 text-sm"><span className="flex min-w-0 items-center gap-2 text-slate-300"><span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{background:COLORS[i % COLORS.length]}}/><span className="truncate">{c.category}</span></span><span className="font-semibold text-white">{money(c.spend)}</span></div>)}</div>
              </div> : <EmptyState title="No categories yet" description="Upload data to visualize category distribution."/>}
            </div>
          </div>
          <div className="panel overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-5"><div><h3 className="font-bold text-white">Campaign Performance</h3><p className="mt-1 text-xs text-slate-400">{currentRows.length} campaigns · values in INR</p></div><button className="btn-secondary" onClick={() => changePage("ads")}>View all <ArrowUpRight size={15}/></button></div>
            <CampaignTable rows={currentRows.slice(0, 5)} onCategoryChange={setRowCategory}/>
          </div>
          <InsightsPanel insights={insights} busy={busy} onGenerate={handleInsights} hasData={hasData}/>
        </>}

        {page === "ads" && <>
          <SectionTitle title="Performance Marketing Overview" subtitle="Campaign metrics with calculated CPM, CPC, CTR, CPA and ROAS." action={<button className="btn-primary" onClick={() => changePage("upload")}><Plus size={16}/> Add campaign data</button>}/>
          <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-5"><MetricCard label="Avg CPM" value={metrics.cpm == null ? "N/A" : money(metrics.cpm)}/><MetricCard label="Avg CPC" value={metrics.cpc == null ? "N/A" : money(metrics.cpc)}/><MetricCard label="Avg CTR" value={metrics.ctr == null ? "N/A" : percent(metrics.ctr)}/><MetricCard label="Avg CPA" value={metrics.cpa == null ? "N/A" : money(metrics.cpa)}/><MetricCard label="Blended ROAS" value={metrics.roas == null ? "N/A" : `${metrics.roas.toFixed(2)}x`} color="green"/></div>
          <div className="panel mb-5 p-5"><div className="flex flex-wrap items-center gap-3"><div className="rounded-xl bg-mint/10 p-3 text-mint"><Target size={23}/></div><div><p className="text-xs font-bold uppercase tracking-wider text-mint">Top revenue campaign</p><h3 className="mt-1 font-bold text-white">{[...currentRows].sort((a,b) => (b.revenue||0)-(a.revenue||0))[0]?.campaignName || "No campaigns available"}</h3><p className="mt-1 text-sm text-slate-400">Revenue {money([...currentRows].sort((a,b) => (b.revenue||0)-(a.revenue||0))[0]?.revenue)} · Results depend on uploaded attribution data.</p></div></div></div>
          <div className="panel overflow-hidden"><TableToolbar search={search} setSearch={setSearch}/><CampaignTable rows={visibleRows} onCategoryChange={setRowCategory}/></div>
        </>}

        {page === "social" && <>
          <SectionTitle title="Social Media Organic Overview" subtitle="Organic reach, engagement and profile performance from uploaded CSV data."/>
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <SocialCard name="Facebook / Organic Social" icon={Facebook} rows={currentRows.filter(r => /facebook|organic|social/i.test(`${r.platform} ${r.campaignName}`))} accent="blue"/>
            <SocialCard name="Instagram Organic" icon={Instagram} rows={currentRows.filter(r => /instagram|reel|social/i.test(`${r.platform} ${r.campaignName}`))} accent="pink"/>
          </div>
          <div className="panel mt-5 p-5"><h3 className="font-bold text-white">Reach and engagement by category</h3><div className="mt-4 h-[320px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartRows}><CartesianGrid stroke="#30314c" strokeDasharray="3 3" vertical={false}/><XAxis dataKey="shortCategory" stroke="#9294b4" tickLine={false} axisLine={false}/><YAxis stroke="#9294b4" tickLine={false} axisLine={false}/><Tooltip contentStyle={{background:"#17172d",border:"1px solid #30314c",borderRadius:12}}/><Legend/><Bar dataKey="reach" name="Reach" fill="#7064ff" radius={[4,4,0,0]}/><Bar dataKey="clicks" name="Clicks / Interactions proxy" fill="#ed3e98" radius={[4,4,0,0]}/></BarChart></ResponsiveContainer></div><p className="mt-2 text-xs text-slate-500">This view only uses fields present in your CSV. Clicks are not the same as social interactions; upload engagement columns for exact engagement reporting.</p></div>
        </>}

        {page === "comparison" && <>
          <SectionTitle title="Month-over-Month Growth Analysis" subtitle={`Comparing ${formatMonth(previousMonth)} with ${formatMonth(month)} for ${activeClient?.name}.`}/>
          <div className="panel overflow-hidden">
            <div className="overflow-x-auto"><table className="data-table"><thead><tr><th>Key metric</th><th>Previous month</th><th>Current month</th><th>Difference</th><th>% change</th></tr></thead><tbody>
              {[
                ["Meta Ad Spend", previousMetrics.spend, metrics.spend, true],
                ["Revenue Generated", previousMetrics.revenue, metrics.revenue, true],
                ["Conversions", previousMetrics.conversions, metrics.conversions, false],
                ["Organic / Total Reach", previousMetrics.reach, metrics.reach, false]
              ].map(([label, prev, curr, currency]) => {
                const diff = curr - prev;
                const change = prev !== 0 ? diff / prev * 100 : null;
                return <tr key={label}><td className="font-semibold text-white">{label}</td><td>{currency ? money(prev) : number(prev)}</td><td className="font-bold text-white">{currency ? money(curr) : number(curr)}</td><td className={diff >= 0 ? "text-mint" : "text-pink-300"}>{diff >= 0 ? "+" : ""}{currency ? money(diff) : number(diff)}</td><td><span className={`rounded-md px-2 py-1 text-xs font-semibold ${diff >= 0 ? "bg-mint/10 text-mint" : "bg-pink/10 text-pink-300"}`}>{change == null ? "N/A" : `${change >= 0 ? "↑ " : "↓ "}${Math.abs(change).toFixed(1)}%`}</span></td></tr>;
              })}
            </tbody></table></div>
            {!previousRows.length && <p className="border-t border-line px-5 py-3 text-xs text-amber-300">No prior-month rows found. The previous-month comparison uses zero as the baseline and should be treated as unavailable until prior data is imported.</p>}
          </div>
          <div className="panel mt-5 p-5"><h3 className="font-bold text-white">Monthly spend and revenue</h3><div className="mt-4 h-[320px]"><ResponsiveContainer width="100%" height="100%"><AreaChart data={trendRows}><defs><linearGradient id="spendFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7064ff" stopOpacity={0.35}/><stop offset="95%" stopColor="#7064ff" stopOpacity={0}/></linearGradient></defs><CartesianGrid stroke="#30314c" strokeDasharray="3 3" vertical={false}/><XAxis dataKey="month" stroke="#9294b4" tickLine={false} axisLine={false}/><YAxis stroke="#9294b4" tickLine={false} axisLine={false}/><Tooltip contentStyle={{background:"#17172d",border:"1px solid #30314c",borderRadius:12}} formatter={v => money(v)}/><Legend/><Area type="monotone" dataKey="spend" name="Spend" stroke="#7064ff" fill="url(#spendFill)"/><Area type="monotone" dataKey="revenue" name="Revenue" stroke="#48d597" fillOpacity={0} /></AreaChart></ResponsiveContainer></div></div>
        </>}

        {page === "upload" && <>
          <SectionTitle title="Data Management & CSV Import" subtitle="Upload CSV reports, review detected fields and run AI categorization."/>
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <UploadCard title="Upload marketing CSV" description="Campaign name is required. Common spend, revenue, reach, clicks and conversion headers are auto-detected." icon={FileSpreadsheet} onFile={handleUpload} fileRef={fileRef} busy={busy === "upload"}/>
            <div className="panel p-5">
              <div className="mb-4 flex items-center gap-3"><div className="rounded-xl bg-brand/15 p-3 text-brand-300"><BrainCircuit size={23}/></div><div><h3 className="font-bold text-white">AI categories & insights</h3><p className="mt-1 text-xs text-slate-400">Classify current month campaigns or generate observations.</p></div></div>
              <div className="space-y-3"><button disabled={!hasData || Boolean(busy)} onClick={handleCategorize} className="btn-primary w-full">{busy === "categorize" ? <LoaderCircle className="animate-spin" size={16}/> : <WandSparkles size={16}/>} {busy === "categorize" ? "Categorizing…" : "Categorize campaigns with AI"}</button><button disabled={!hasData || Boolean(busy)} onClick={handleInsights} className="btn-secondary w-full">{busy === "insights" ? <LoaderCircle className="animate-spin" size={16}/> : <Sparkles size={16}/>} Generate performance insights</button></div>
              <p className="mt-4 text-xs leading-5 text-slate-500">Live OpenAI requires OPENAI_API_KEY in the server environment. Without it, demo fallback rules are used and the interface labels the mode.</p>
            </div>
          </div>
          {uploadSummary && <div className="panel mt-5 p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-bold text-white">Latest upload</h3><p className="mt-1 text-sm text-slate-400">{uploadSummary.fileName} · {uploadSummary.count} rows detected</p></div><span className="pill pill-green"><Check size={13}/> Parsed</span></div><div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">{Object.entries(uploadSummary.mapping).map(([field, header]) => <div key={field} className="rounded-lg border border-line bg-ink/40 p-3"><p className="text-xs text-slate-500">{field}</p><p className="mt-1 truncate text-sm font-semibold text-white">{header}</p></div>)}</div>{uploadSummary.errors > 0 && <p className="mt-3 text-xs text-amber-300">{uploadSummary.errors} parser warning(s). Please review the imported values.</p>}</div>}
          <div className="panel mt-5 overflow-hidden"><div className="border-b border-line p-5"><h3 className="font-bold text-white">CSV format guidance</h3><p className="mt-1 text-sm text-slate-400">Example headers: Campaign Name, Platform, Objective, Spend, Revenue, Impressions, Reach, Clicks, Conversions, Month.</p></div><div className="p-5"><button className="btn-secondary" onClick={() => { const blob = new Blob(["Campaign Name,Platform,Objective,Spend,Revenue,Impressions,Reach,Clicks,Conversions,Month\nSample Sales Campaign,Meta Ads,Sales,25000,85000,120000,80000,3200,45,2026-10\nInstagram Styling Reels,Instagram,Engagement,5000,0,0,25000,650,0,2026-10\n"], {type:"text/csv;charset=utf-8"}); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "sample-marketing-upload.csv"; a.click(); URL.revokeObjectURL(url); }}><Download size={15}/> Download sample CSV</button></div></div>
        </>}

        {page === "clients" && <>
          <SectionTitle title="Client Portfolio Manager" subtitle="Manage client profiles and switch between reporting workspaces." action={<button className="btn-primary" onClick={() => setShowAddClient(true)}><Plus size={16}/> Add new client</button>}/>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">{clients.map(client => <div key={client.id} className={`panel p-5 ${client.id === clientId ? "border-brand/60" : ""}`}><div className="mb-4 flex items-center justify-between gap-2"><span className="pill">{client.industry}</span>{client.id === clientId && <span className="pill pill-green">Active</span>}</div><h3 className="text-lg font-bold text-white">{client.name}</h3><p className="mt-2 text-sm text-slate-400">{campaigns.filter(c => c.clientId === client.id).length} campaign records saved in this browser session</p><button className="btn-secondary mt-5 w-full" onClick={() => { setClientId(client.id); changePage("dashboard"); }}>Select client</button></div>)}</div>
          {showAddClient && <Modal title="Add client" onClose={() => setShowAddClient(false)}><form onSubmit={addClient} className="space-y-4"><div><label className="field-label">Client name</label><input autoFocus required className="field w-full" value={newClientName} onChange={e => setNewClientName(e.target.value)} placeholder="e.g. Northstar Retail"/></div><div><label className="field-label">Industry</label><select className="field w-full" value={newClientIndustry} onChange={e => setNewClientIndustry(e.target.value)}>{["Digital Marketing","E-Commerce","Real Estate","Education","Healthcare","Professional Services","Other"].map(x => <option key={x}>{x}</option>)}</select></div><button className="btn-primary w-full" type="submit">Create client</button></form></Modal>}
        </>}

        {page === "reports" && <>
          <SectionTitle title="Reports & Exports" subtitle="Generate downloadable client deliverables from the selected reporting month."/>
          <div className="hero-panel mb-6 flex flex-wrap items-center justify-between gap-4 p-5"><div><h3 className="text-lg font-bold text-white">{activeClient?.name}</h3><p className="mt-1 text-sm text-slate-300">{formatMonth(month)} · {currentRows.length} campaign rows</p></div><span className="pill pill-green"><ShieldCheck size={13}/> Ready to export</span></div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <ExportCard icon={FileText} title="PDF report" description="Executive summary, KPI cards, campaign table and insights." label="Download PDF" onClick={exportActions.pdf} color="text-pink-300 bg-pink/10"/>
            <ExportCard icon={LayoutDashboard} title="PowerPoint deck" description="Presentation-ready slides for client reviews." label="Download PPTX" onClick={exportActions.pptx} color="text-amber-300 bg-amber-400/10"/>
            <ExportCard icon={FileSpreadsheet} title="Categorized CSV" description="Normalized campaign data with category and calculated fields where present." label="Download CSV" onClick={exportActions.csv} color="text-mint bg-mint/10"/>
          </div>
          <InsightsPanel insights={insights} busy={busy} onGenerate={handleInsights} hasData={hasData}/>
          <div className="panel mt-5 p-5"><h3 className="font-bold text-white">Before sharing with a client</h3><ul className="mt-3 space-y-2 text-sm text-slate-400">{["Confirm client and reporting month in the header.", "Review AI-suggested categories and edit any incorrect assignments.", "Verify missing values and attribution before interpreting ROAS.", "Use the sample dataset only for testing; replace it with approved client data."].map(t => <li key={t} className="flex gap-2"><Check size={15} className="mt-0.5 shrink-0 text-mint"/>{t}</li>)}</ul></div>
        </>}

        <footer className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line py-5 text-xs text-slate-500"><span>© 2026 Report Studio · AI-powered marketing reports</span><span className="flex items-center gap-1"><ShieldCheck size={13}/> Sample data is fictional</span></footer>
      </div>
    </main>
  </div>;
}

function CampaignTable({ rows, onCategoryChange }) {
  if (!rows.length) return <div className="p-8 text-center text-sm text-slate-400">No campaign rows for this month. Upload a CSV or select another month.</div>;
  return <div className="overflow-x-auto"><table className="data-table min-w-[950px]"><thead><tr><th>Campaign name</th><th>Platform</th><th>Category</th><th>Spend</th><th>Revenue</th><th>Reach</th><th>Clicks</th><th>Results</th><th>ROAS</th></tr></thead><tbody>
    {rows.map(row => <tr key={row.id}><td className="max-w-[210px]"><div className="font-semibold text-white">{row.campaignName}</div><div className="mt-1 text-[11px] text-slate-500">{row.objective || "Objective not provided"}</div></td><td>{row.platform || "—"}</td><td><select className="category-select" value={categoryOptions.includes(row.category) ? row.category : "Other / Needs Review"} onChange={e => onCategoryChange(row.id, e.target.value)}>{categoryOptions.map(c => <option key={c}>{c}</option>)}</select>{row.aiConfidence != null && <div className="mt-1 text-[10px] text-slate-500">AI confidence {(row.aiConfidence*100).toFixed(0)}%</div>}</td><td className="font-semibold text-white">{row.spend == null ? "N/A" : money(row.spend)}</td><td className="text-mint">{row.revenue == null ? "N/A" : money(row.revenue)}</td><td>{row.reach == null ? "N/A" : number(row.reach)}</td><td>{row.clicks == null ? "N/A" : number(row.clicks)}</td><td className="font-semibold text-white">{row.conversions == null ? "N/A" : number(row.conversions)}</td><td className="font-semibold text-mint">{row.spend > 0 && row.revenue != null ? `${(row.revenue/row.spend).toFixed(2)}x` : "N/A"}</td></tr>)}
  </tbody></table></div>;
}

function TableToolbar({ search, setSearch }) {
  return <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4"><div><h3 className="font-bold text-white">Campaign breakdown</h3><p className="mt-1 text-xs text-slate-400">Edit categories directly in the table.</p></div><div className="relative w-full sm:w-64"><Search size={15} className="absolute left-3 top-3 text-slate-500"/><input className="field w-full pl-9" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search campaigns…"/></div></div>;
}

function UploadCard({ title, description, icon: Icon, onFile, fileRef, busy }) {
  const [drag, setDrag] = useState(false);
  return <div className={`panel flex min-h-[270px] flex-col items-center justify-center border-2 border-dashed p-7 text-center transition ${drag ? "border-brand bg-brand/10" : "border-line"}`} onDragOver={e => {e.preventDefault();setDrag(true);}} onDragLeave={() => setDrag(false)} onDrop={e => {e.preventDefault();setDrag(false);onFile(e.dataTransfer.files?.[0]);}}>
    <div className="mb-4 rounded-2xl bg-brand/15 p-4 text-brand-300"><Icon size={30}/></div><h3 className="text-lg font-bold text-white">{title}</h3><p className="mt-2 max-w-sm text-sm leading-6 text-slate-400">{description}</p>
    <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={e => onFile(e.target.files?.[0])}/>
    <button disabled={busy} className="btn-primary mt-5" onClick={() => fileRef.current?.click()}>{busy ? <LoaderCircle className="animate-spin" size={16}/> : <Upload size={16}/>} {busy ? "Processing…" : "Choose CSV file"}</button>
    <p className="mt-3 text-xs text-slate-500">CSV only · Maximum 10 MB · You can also drag and drop</p>
  </div>;
}

function SocialCard({ name, icon: Icon, rows, accent }) {
  const total = getMetrics(rows);
  return <div className="panel p-5"><div className="flex items-center gap-3 border-b border-line pb-4"><div className={`rounded-xl p-3 ${accent === "pink" ? "bg-pink/10 text-pink-300" : "bg-sky-400/10 text-sky-300"}`}><Icon size={23}/></div><div><h3 className="font-bold text-white">{name}</h3><p className="mt-1 text-xs text-slate-400">Detected from platform and campaign names</p></div><span className="ml-auto pill">{rows.length} rows</span></div>
    <div className="mt-4 grid grid-cols-3 gap-2">{[["Reach",number(total.reach)],["Clicks",number(total.clicks)],["Spend",money(total.spend)]].map(([label,value]) => <div key={label} className="rounded-xl bg-ink/50 p-3 text-center"><p className="text-xs text-slate-400">{label}</p><p className="mt-2 text-lg font-bold text-white">{value}</p></div>)}</div>
    <p className="mt-4 text-xs leading-5 text-slate-500">Organic engagement and follower growth require those columns in the source CSV. This card does not infer missing metrics.</p>
  </div>;
}

function InsightsPanel({ insights, busy, onGenerate, hasData }) {
  return <div className="panel mt-6 p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><div className="rounded-xl bg-amber-400/10 p-3 text-amber-300"><Sparkles size={20}/></div><div><h3 className="font-bold text-white">AI Performance Insights</h3><p className="mt-1 text-xs text-slate-400">Generated from available metrics; review before sharing.</p></div></div><button disabled={!hasData || Boolean(busy)} onClick={onGenerate} className="btn-secondary">{busy === "insights" ? <LoaderCircle className="animate-spin" size={15}/> : <WandSparkles size={15}/>} Generate insights</button></div>
    {insights.length ? <ul className="mt-5 grid gap-3 md:grid-cols-2">{insights.map((insight,i) => <li key={i} className="flex gap-3 rounded-xl border border-line bg-ink/40 p-4 text-sm leading-6 text-slate-300"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-brand/15 text-xs font-bold text-brand-200">{i+1}</span>{insight}</li>)}</ul> : <div className="mt-5 rounded-xl border border-dashed border-line p-5 text-sm text-slate-400">No insights generated yet. Click “Generate insights” to analyze the current reporting period.</div>}
  </div>;
}

function ExportCard({ icon: Icon, title, description, label, onClick, color }) {
  const [working, setWorking] = useState(false);
  const run = async () => { setWorking(true); try { await onClick(); } finally { setWorking(false); } };
  return <div className="panel p-5"><div className={`mb-4 inline-flex rounded-2xl p-3 ${color}`}><Icon size={25}/></div><h3 className="text-lg font-bold text-white">{title}</h3><p className="mt-2 min-h-12 text-sm leading-6 text-slate-400">{description}</p><button disabled={working} className="btn-primary mt-5 w-full" onClick={run}>{working ? <LoaderCircle className="animate-spin" size={16}/> : <Download size={16}/>} {working ? "Preparing…" : label}</button></div>;
}

function Modal({ title, onClose, children }) {
  return <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}><div className="w-full max-w-md rounded-2xl border border-line bg-panel p-5 shadow-2xl"><div className="mb-5 flex items-center justify-between"><h3 className="text-lg font-bold text-white">{title}</h3><button className="icon-btn" onClick={onClose}><X size={17}/></button></div>{children}</div></div>;
}
