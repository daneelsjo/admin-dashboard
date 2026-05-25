// src/components/dashboard/GitHubActionsMonitor.jsx
import { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";
import {
  ExternalLink, RefreshCw, Clock, GitBranch as GithubIcon,
  Zap, Bell, BellOff, Search, RotateCcw,
} from "lucide-react";
import { clsx } from "clsx";
import { getGitHubActionsUrl } from "../../config/sites";
import { StatusBadge } from "./StatusBadge";
import { getStatusVariant } from "../../hooks/useGitHubStatus";

const INTERVAL_DEV  = 1000 * 20;
const INTERVAL_IDLE = 1000 * 60 * 60;

const IS_PROD    = import.meta.env.PROD;
const VITE_TOKEN = import.meta.env.VITE_GITHUB_TOKEN;

async function fetchRepoRuns(owner, repo) {
  let url, headers = {};
  if (IS_PROD) {
    url = `https://api.github.com/repos/${owner}/${repo}/actions/runs?per_page=5`;
    headers = {
      Accept: "application/vnd.github+json",
      ...(VITE_TOKEN && { Authorization: `Bearer ${VITE_TOKEN}` }),
    };
  } else {
    url = `/api/github/${owner}/${repo}/runs?per_page=5`;
  }
  const res = await fetch(url, { headers });
  if (res.status === 404) return { runs: [], error: "repo_not_found" };
  if (res.status === 401 || res.status === 403) return { runs: [], error: "no_access" };
  if (!res.ok) throw new Error(`GitHub API ${res.status}`);
  const data = await res.json();
  return { runs: data.workflow_runs ?? [], error: null };
}

function useRepoRuns(owner, repo, pollInterval) {
  return useQuery({
    queryKey: ["gh-actions", owner, repo],
    queryFn: () => fetchRepoRuns(owner, repo),
    refetchInterval: pollInterval,
    staleTime: pollInterval,
    retry: 1,
  });
}

const borderByVariant = {
  success: "border-l-2 border-emerald-600",
  failure: "border-l-2 border-red-600",
  running: "border-l-2 border-amber-400",
  warning: "border-l-2 border-amber-600",
  unknown: "border-l-2 border-zinc-700",
};

function RunRow({ run }) {
  const variant = getStatusVariant(run.status, run.conclusion);
  return (
    <div className={clsx(
      "flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-zinc-800/60 transition-colors",
      borderByVariant[variant] ?? borderByVariant.unknown
    )}>
      <div className="flex items-center gap-3 min-w-0">
        <StatusBadge variant={variant} />
        <span className="text-xs text-white truncate">
          {run.head_commit?.message?.split("\n")[0] ?? run.name}
        </span>
        {run.head_branch && (
          <span className="hidden sm:inline text-xs text-zinc-600 font-mono truncate">
            {run.head_branch}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-xs text-zinc-500 flex items-center gap-1">
          <Clock size={10} />
          {formatDistanceToNow(new Date(run.updated_at), { addSuffix: true, locale: nl })}
        </span>
        <a
          href={run.html_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-600 hover:text-zinc-300 transition-colors"
          title="Open in GitHub"
        >
          <ExternalLink size={12} />
        </a>
      </div>
    </div>
  );
}

function RepoSection({ site, pollInterval, failedOnly }) {
  const queryClient = useQueryClient();
  const { data, isLoading, isFetching, dataUpdatedAt, isError } =
    useRepoRuns(site.owner, site.repo, pollInterval);
  const lastNotifiedId = useRef(null);

  const runs = data?.runs ?? [];
  const fetchError = data?.error ?? null;
  const latestRun = runs[0] ?? null;
  const latestVariant = latestRun
    ? getStatusVariant(latestRun.status, latestRun.conclusion)
    : "unknown";

  // Send browser notification when a new failure is detected
  useEffect(() => {
    if (!latestRun) return;
    if (latestVariant !== "failure") return;
    if (Notification.permission !== "granted") return;
    if (lastNotifiedId.current === latestRun.id) return;
    lastNotifiedId.current = latestRun.id;
    const msg = latestRun.head_commit?.message?.split("\n")[0] ?? latestRun.name ?? "Deploy mislukt";
    new Notification(`Deploy mislukt — ${site.name}`, {
      body: msg,
      icon: "/favicon.ico",
    });
  }, [latestRun?.id, latestVariant, site.name]);

  // Hidden when "failed only" filter is on and latest isn't a failure
  if (failedOnly && latestVariant !== "failure") return null;

  function reload() {
    queryClient.invalidateQueries({ queryKey: ["gh-actions", site.owner, site.repo] });
  }

  const headerAccent = {
    success: "border-t-emerald-600",
    failure: "border-t-red-600",
    running: "border-t-amber-400",
    warning: "border-t-amber-600",
    unknown: "border-t-zinc-700",
  }[latestVariant];

  return (
    <div className={clsx("rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden border-t-2", headerAccent)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/80">
        <div className="flex items-center gap-2 min-w-0">
          <GithubIcon size={14} className="text-zinc-500 shrink-0" />
          <span className="text-sm font-semibold text-white truncate">{site.name}</span>
          <span className="hidden sm:inline text-xs text-zinc-600 font-mono truncate">
            {site.owner}/{site.repo}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isFetching && <RefreshCw size={12} className="text-zinc-500 animate-spin" />}
          {dataUpdatedAt && (
            <span className="text-xs text-zinc-600">
              {formatDistanceToNow(dataUpdatedAt, { addSuffix: true })}
            </span>
          )}
          <button
            onClick={reload}
            title="Herladen"
            className="rounded p-1 text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            <RotateCcw size={12} />
          </button>
          <a
            href={getGitHubActionsUrl(site.owner, site.repo)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-zinc-500 hover:text-white transition-colors flex items-center gap-1"
          >
            <ExternalLink size={12} />
            <span className="hidden sm:inline">Actions</span>
          </a>
        </div>
      </div>

      {/* Run list */}
      {isLoading ? (
        <div className="divide-y divide-zinc-800/50">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="px-4 py-3 animate-pulse flex items-center gap-3">
              <div className="h-5 w-20 rounded-full bg-zinc-800" />
              <div className="h-3 w-40 rounded bg-zinc-800" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="px-4 py-6 text-center text-xs text-red-400">
          Onverwachte fout — probeer de pagina te verversen.
        </div>
      ) : fetchError === "no_access" ? (
        <div className="px-4 py-6 text-center space-y-1">
          <p className="text-xs text-amber-400">Geen toegang tot deze repo.</p>
          <p className="text-xs text-zinc-600">
            Controleer of <code className="text-zinc-400">VITE_GITHUB_TOKEN</code> is ingesteld als GitHub Secret en toegang heeft tot deze repository.
          </p>
        </div>
      ) : fetchError === "repo_not_found" ? (
        <div className="px-4 py-6 text-center text-xs text-zinc-500">
          Repository niet gevonden — controleer de owner/repo naam in het Websites-tabblad.
        </div>
      ) : runs.length === 0 ? (
        <div className="px-4 py-6 text-center text-xs text-zinc-600">
          Geen workflow-runs gevonden voor deze repo.
        </div>
      ) : (
        <div className="divide-y divide-zinc-800/40">
          {runs.map((run) => (
            <RunRow key={run.id} run={run} />
          ))}
        </div>
      )}
    </div>
  );
}

export function GitHubActionsMonitor({ sites = [] }) {
  const [devMode, setDevMode] = useState(
    () => localStorage.getItem("gh-devmode") === "true"
  );
  const [search, setSearch] = useState("");
  const [failedOnly, setFailedOnly] = useState(false);
  const [notifPerm, setNotifPerm] = useState(
    () => ("Notification" in window ? Notification.permission : "denied")
  );

  function toggleDevMode() {
    setDevMode((prev) => {
      const next = !prev;
      localStorage.setItem("gh-devmode", String(next));
      return next;
    });
  }

  async function requestNotifPermission() {
    const perm = await Notification.requestPermission();
    setNotifPerm(perm);
  }

  const pollInterval = devMode ? INTERVAL_DEV : INTERVAL_IDLE;
  const filteredSites = sites.filter((s) =>
    s.name?.toLowerCase().includes(search.toLowerCase())
  );

  if (sites.length === 0) {
    return (
      <section>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-500">
          GitHub Actions
        </h2>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-6 py-12 text-center">
          <p className="text-sm text-zinc-500">Nog geen websites geconfigureerd.</p>
          <p className="text-xs text-zinc-600 mt-1">Voeg een website toe via het tabblad "Websites".</p>
        </div>
      </section>
    );
  }

  return (
    <section>
      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mr-auto">
          GitHub Actions
        </h2>

        {/* Notification permission */}
        {notifPerm === "granted" ? (
          <span className="flex items-center gap-1 text-xs text-emerald-600" title="Meldingen ingeschakeld">
            <Bell size={11} />
          </span>
        ) : (
          <button
            onClick={requestNotifPermission}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
            title="Meldingen inschakelen voor deploy-fouten"
          >
            <Bell size={11} />
            Meldingen
          </button>
        )}

        {/* Search */}
        <div className="relative">
          <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Zoeken…"
            className="rounded-lg border border-zinc-700 bg-zinc-800 pl-7 pr-3 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 w-36"
          />
        </div>

        {/* Failed only toggle */}
        <button
          onClick={() => setFailedOnly((v) => !v)}
          className={clsx(
            "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
            failedOnly
              ? "border-red-800 bg-red-950 text-red-400 hover:bg-red-900"
              : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:text-white"
          )}
          title={failedOnly ? "Toon alle repos" : "Toon alleen mislukte deploys"}
        >
          <BellOff size={11} />
          {failedOnly ? "Alleen fouten" : "Alle repos"}
        </button>

        {/* Dev mode toggle */}
        <button
          onClick={toggleDevMode}
          className={clsx(
            "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
            devMode
              ? "border-amber-700 bg-amber-950 text-amber-400 hover:bg-amber-900"
              : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:text-white"
          )}
          title={devMode ? "Dev-modus aan — elke 20s" : "Idle-modus — elke 1 uur"}
        >
          <Zap size={11} className={devMode ? "text-amber-400" : "text-zinc-600"} />
          {devMode ? "Dev · elke 20s" : "Idle · elke 1u"}
        </button>
      </div>

      {filteredSites.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-6 py-10 text-center">
          <p className="text-sm text-zinc-500">Geen resultaten voor "{search}".</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filteredSites.map((site) => (
            <RepoSection
              key={site.id}
              site={site}
              pollInterval={pollInterval}
              failedOnly={failedOnly}
            />
          ))}
        </div>
      )}
    </section>
  );
}
