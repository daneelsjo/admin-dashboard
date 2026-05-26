// src/pages/DashboardPage.jsx
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useSites } from "../hooks/useSites";
import { useTokens } from "../hooks/useTokens";
import { SiteCard } from "../components/dashboard/SiteCard";
import { DomainTable } from "../components/admin/DomainTable";
import { SiteForm } from "../components/admin/SiteForm";
import { TokenTable } from "../components/admin/TokenTable";
import { GitHubActionsMonitor } from "../components/dashboard/GitHubActionsMonitor";
import {
  Flame, LayoutGrid, Database, LogOut, RefreshCw,
  GitPullRequest, Globe, AlertTriangle, Key,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useDomainWarnings } from "../hooks/useDomainWarnings";
import { differenceInDays, parseISO, isPast } from "date-fns";
import { clsx } from "clsx";
import { getStatusVariant } from "../hooks/useGitHubStatus";
import { getScoreColor } from "../hooks/usePageSpeed";

const TABS = [
  { id: "overview", label: "Overzicht",     Icon: LayoutGrid    },
  { id: "actions",  label: "GitHub Actions", Icon: GitPullRequest },
  { id: "websites", label: "Websites",       Icon: Globe         },
  { id: "domains",  label: "Domeinen",       Icon: Database      },
  { id: "tokens",   label: "API Keys",       Icon: Key           },
];

function isExpiringSoon(dateStr) {
  if (!dateStr) return false;
  const days = differenceInDays(parseISO(dateStr), new Date());
  return isPast(parseISO(dateStr)) || days <= 30;
}

export function DashboardPage() {
  const { user, logout }                 = useAuth();
  const [activeTab, setActiveTab]        = useState("overview");
  const queryClient                      = useQueryClient();
  const { sites, loading: sitesLoading } = useSites();
  const { tokens }                       = useTokens();
  const expiringDomains                  = useDomainWarnings();

  // Tokens expiring within 30 days
  const expiringTokens = tokens.filter((t) => isExpiringSoon(t.expiryDate));

  // Current time for footer, updated every minute
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Subscribe to query cache so stats stay reactive
  const [, setTick] = useState(0);
  useEffect(() => {
    return queryClient.getQueryCache().subscribe(() => setTick((n) => n + 1));
  }, [queryClient]);

  // Aggregate stats from query cache
  const onlineCount = sites.filter((s) =>
    queryClient.getQueryData(["uptime", s.url])?.up === true
  ).length;

  const failedCount = sites.filter((s) => {
    const gh  = queryClient.getQueryData(["github-status", s.owner, s.repo]);
    const act = queryClient.getQueryData(["gh-actions",    s.owner, s.repo]);
    const run = act?.runs?.[0];
    if (run) return getStatusVariant(run.status, run.conclusion) === "failure";
    if (gh)  return getStatusVariant(gh.status,  gh.conclusion)  === "failure";
    return false;
  }).length;

  const psiScores = sites
    .map((s) => queryClient.getQueryData(["pagespeed", s.url])?.score)
    .filter((s) => s != null);
  const avgPsi = psiScores.length
    ? Math.round(psiScores.reduce((a, b) => a + b, 0) / psiScores.length)
    : null;

  const statsData = [
    {
      label:  "Online",
      value:  sitesLoading ? "—" : `${onlineCount} / ${sites.length}`,
      sub:    "websites bereikbaar",
      accent: !sitesLoading && sites.length > 0 && onlineCount === sites.length
        ? "text-emerald-400" : onlineCount > 0 ? "text-amber-400" : "text-zinc-300",
    },
    {
      label:  "Mislukte deploys",
      value:  sitesLoading ? "—" : failedCount,
      sub:    failedCount > 0 ? "check GitHub Actions" : "alles groen",
      accent: failedCount > 0 ? "text-red-400" : "text-emerald-400",
    },
    {
      label:  "Domeinen",
      value:  expiringDomains.length || "—",
      sub:    expiringDomains.length > 0 ? "verlopen binnenkort" : "alles ok",
      accent: expiringDomains.length > 0 ? "text-amber-400" : "text-zinc-300",
    },
    {
      label:  "PSI gemiddeld",
      value:  avgPsi ?? "—",
      sub:    "mobile performance",
      accent: getScoreColor(avgPsi),
    },
  ];

  function handleRefresh() {
    queryClient.invalidateQueries();
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Top nav */}
      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2">
            <Flame size={16} className="text-orange-400" />
            <span className="text-sm font-semibold">Admin Dashboard</span>
          </div>

          <nav className="flex items-center gap-1">
            {TABS.map(({ id, label, Icon }) => {
              const hasActionsBadge = id === "actions" && failedCount > 0;
              const hasDomainsBadge = id === "domains" && expiringDomains.length > 0;
              const hasTokensBadge  = id === "tokens"  && expiringTokens.length > 0;
              const hasBadge        = hasActionsBadge || hasDomainsBadge || hasTokensBadge;
              const badgeColor      = hasActionsBadge ? "bg-red-500" : "bg-amber-500";
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={clsx(
                    "relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                    activeTab === id ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-white"
                  )}
                >
                  <Icon size={13} />
                  <span className="hidden sm:inline">{label}</span>
                  {hasBadge && (
                    <span className={clsx("absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full", badgeColor)} />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              title="Data verversen"
              className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              <RefreshCw size={14} />
            </button>
            <span className="text-xs text-zinc-600 hidden sm:block">{user?.email}</span>
            <button
              onClick={logout}
              title="Uitloggen"
              className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* Stats row */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {statsData.map(({ label, value, sub, accent }) => (
            <div key={label} className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3">
              <p className="text-xs text-zinc-500">{label}</p>
              <p className={clsx("mt-0.5 text-lg font-bold tabular-nums", accent)}>{value}</p>
              {sub && <p className="text-xs text-zinc-600 mt-0.5">{sub}</p>}
            </div>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "overview" && (
          <section>
            {/* Domain expiry warning */}
            {expiringDomains.length > 0 && (
              <div className="mb-4 rounded-xl border border-amber-800/60 bg-amber-950/40 px-4 py-3 flex items-start gap-3">
                <AlertTriangle size={15} className="text-amber-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-amber-300">
                    {expiringDomains.length === 1 ? "1 domein verloopt binnenkort" : `${expiringDomains.length} domeinen verlopen binnenkort`}
                  </p>
                  <ul className="mt-1 space-y-0.5">
                    {expiringDomains.map((d) => {
                      const expired = isPast(parseISO(d.expiryDate));
                      const days    = differenceInDays(parseISO(d.expiryDate), new Date());
                      return (
                        <li key={d.id} className="text-xs text-amber-500/80">
                          <span className="font-mono text-amber-300">{d.domain ?? d.name}</span>
                          {" — "}
                          {expired ? <span className="text-red-400">verlopen</span> : `verloopt over ${days} dag${days !== 1 ? "en" : ""}`}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            )}

            {/* Token expiry warning */}
            {expiringTokens.length > 0 && (
              <div className="mb-6 rounded-xl border border-amber-800/60 bg-amber-950/40 px-4 py-3 flex items-start gap-3">
                <Key size={15} className="text-amber-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-amber-300">
                    {expiringTokens.length === 1 ? "1 API key verloopt binnenkort" : `${expiringTokens.length} API keys verlopen binnenkort`}
                  </p>
                  <ul className="mt-1 space-y-0.5">
                    {expiringTokens.map((t) => {
                      const expired = isPast(parseISO(t.expiryDate));
                      const days    = differenceInDays(parseISO(t.expiryDate), new Date());
                      return (
                        <li key={t.id} className="text-xs text-amber-500/80 flex items-center gap-2">
                          <span className="text-amber-300 font-medium">{t.label}</span>
                          {t.service && <span className="text-zinc-600">· {t.service}</span>}
                          {" — "}
                          {expired ? <span className="text-red-400">verlopen</span> : `verloopt over ${days} dag${days !== 1 ? "en" : ""}`}
                          {t.renewUrl && (
                            <a href={t.renewUrl} target="_blank" rel="noopener noreferrer"
                              className="text-zinc-500 hover:text-white transition-colors ml-1"
                              title="Vernieuwen"
                            >
                              <ExternalLinkInline />
                            </a>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            )}

            <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-500">
              Websites ({sitesLoading ? "…" : sites.length})
            </h2>
            {sitesLoading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-48 rounded-xl border border-zinc-800 bg-zinc-900 animate-pulse" />
                ))}
              </div>
            ) : sites.length === 0 ? (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-6 py-12 text-center">
                <p className="text-sm text-zinc-500">Nog geen websites toegevoegd.</p>
                <button
                  onClick={() => setActiveTab("websites")}
                  className="mt-3 text-xs text-zinc-400 underline hover:text-white transition-colors"
                >
                  Voeg je eerste website toe →
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {sites.map((site) => (
                  <SiteCard
                    key={site.id}
                    site={site}
                    expiringTokens={expiringTokens.filter((t) => t.siteId === site.id)}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === "actions"  && <GitHubActionsMonitor sites={sites} />}
        {activeTab === "websites" && <section><SiteForm /></section>}
        {activeTab === "domains"  && <section><DomainTable /></section>}
        {activeTab === "tokens"   && <section><TokenTable /></section>}
      </main>

      {/* Footer */}
      <footer className="pb-6 text-center text-xs text-zinc-700">
        Live data — bijgewerkt om {now.toLocaleTimeString("nl-BE", { hour: "2-digit", minute: "2-digit" })}
      </footer>
    </div>
  );
}

// Inline icon to avoid import duplication
function ExternalLinkInline() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline" }}>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
      <polyline points="15 3 21 3 21 9"/>
      <line x1="10" y1="14" x2="21" y2="3"/>
    </svg>
  );
}
