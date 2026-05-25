// src/components/dashboard/GitHubActionsMonitor.jsx
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";
import { ExternalLink, RefreshCw, Clock, GitBranch as GithubIcon, Zap } from "lucide-react";
import { clsx } from "clsx";
import { getGitHubActionsUrl } from "../../config/sites";
import { StatusBadge } from "./StatusBadge";
import { getStatusVariant } from "../../hooks/useGitHubStatus";

const POLL_INTERVAL = 1000 * 20; // 20 seconds

async function fetchRepoRuns(owner, repo) {
  const res = await fetch(`/api/github/${owner}/${repo}/runs?per_page=5`);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const data = await res.json();
  return data.workflow_runs ?? [];
}

function useRepoRuns(owner, repo) {
  return useQuery({
    queryKey: ["gh-actions", owner, repo],
    queryFn: () => fetchRepoRuns(owner, repo),
    refetchInterval: POLL_INTERVAL,
    staleTime: POLL_INTERVAL,
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
    <div
      className={clsx(
        "flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-zinc-800/60 transition-colors",
        borderByVariant[variant] ?? borderByVariant.unknown
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <StatusBadge variant={variant} />
        <span className="text-xs text-white truncate">{run.name}</span>
        {run.head_branch && (
          <span className="hidden sm:inline text-xs text-zinc-600 font-mono truncate">
            {run.head_branch}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-xs text-zinc-500 flex items-center gap-1">
          <Clock size={10} />
          {formatDistanceToNow(new Date(run.updated_at), {
            addSuffix: true,
            locale: nl,
          })}
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

function RepoSection({ site }) {
  const { data: runs, isLoading, isFetching, dataUpdatedAt, isError } =
    useRepoRuns(site.owner, site.repo);

  const latestVariant =
    runs?.[0] ? getStatusVariant(runs[0].status, runs[0].conclusion) : "unknown";

  const headerAccent = {
    success: "border-t-emerald-600",
    failure: "border-t-red-600",
    running: "border-t-amber-400",
    warning: "border-t-amber-600",
    unknown: "border-t-zinc-700",
  }[latestVariant];

  return (
    <div
      className={clsx(
        "rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden border-t-2",
        headerAccent
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/80">
        <div className="flex items-center gap-2 min-w-0">
          <GithubIcon size={14} className="text-zinc-500 shrink-0" />
          <span className="text-sm font-semibold text-white truncate">{site.name}</span>
          <span className="hidden sm:inline text-xs text-zinc-600 font-mono truncate">
            {site.owner}/{site.repo}
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {isFetching && (
            <RefreshCw size={12} className="text-zinc-500 animate-spin" />
          )}
          {dataUpdatedAt ? (
            <span className="text-xs text-zinc-600">
              {formatDistanceToNow(dataUpdatedAt, { addSuffix: true })}
            </span>
          ) : null}
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
          Kon workflows niet ophalen — controleer of de API-server actief is.
        </div>
      ) : runs?.length === 0 ? (
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
  if (sites.length === 0) {
    return (
      <section>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-500">
          GitHub Actions
        </h2>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-6 py-12 text-center">
          <p className="text-sm text-zinc-500">Nog geen websites geconfigureerd.</p>
          <p className="text-xs text-zinc-600 mt-1">
            Voeg een website toe via het tabblad "Websites".
          </p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
          GitHub Actions
        </h2>
        <span className="flex items-center gap-1.5 text-xs text-zinc-600">
          <Zap size={11} className="text-amber-500" />
          Live · elke 20s vernieuwd
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {sites.map((site) => (
          <RepoSection key={site.id} site={site} />
        ))}
      </div>
    </section>
  );
}
