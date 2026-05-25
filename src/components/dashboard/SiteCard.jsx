// src/components/dashboard/SiteCard.jsx
import { ExternalLink, GitBranch as GithubIcon, Flame } from "lucide-react";
import { clsx } from "clsx";
import { StatusBadge } from "./StatusBadge";
import { useGitHubStatus, getStatusVariant } from "../../hooks/useGitHubStatus";
import { usePageSpeed, getScoreColor } from "../../hooks/usePageSpeed";
import { useUptimeCheck } from "../../hooks/useUptimeCheck";
import { useUptimePercent } from "../../hooks/useUptimeHistory";
import { getGitHubUrl, getFirebaseConsoleUrl, getGitHubActionsUrl } from "../../config/sites";

const dotColor = {
  success: "bg-emerald-500",
  failure: "bg-red-500",
  running: "bg-amber-400",
  warning: "bg-amber-600",
  unknown: "bg-zinc-600",
};

function QuickLink({ href, icon: Icon, label }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors"
      title={label}
    >
      <Icon size={13} />
      {label}
    </a>
  );
}

export function SiteCard({ site }) {
  const { data: ghData, isLoading: ghLoading } = useGitHubStatus(site.owner, site.repo);
  const { data: psData, isLoading: psLoading } = usePageSpeed(site.url);
  const { data: upData, isLoading: upLoading } = useUptimeCheck(site.url);
  const uptimePercent = useUptimePercent(site.url);

  const statusVariant = ghLoading
    ? "unknown"
    : getStatusVariant(ghData?.status, ghData?.conclusion);

  const score = psData?.score ?? null;

  return (
    <div className="group relative rounded-xl border border-zinc-800 bg-zinc-900 p-5 transition-all hover:border-zinc-600 hover:shadow-lg hover:shadow-black/40">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-white text-sm">{site.name}</h3>
          <p className="mt-0.5 text-xs text-zinc-500">{site.description}</p>
          {site.notes && (
            <p className="mt-0.5 text-xs text-zinc-600 italic">{site.notes}</p>
          )}
        </div>

        {/* Uptime dot + % */}
        <div className="flex items-center gap-1.5 mt-0.5 shrink-0">
          {uptimePercent !== null && (
            <span className={clsx(
              "text-xs font-medium tabular-nums",
              uptimePercent >= 99 ? "text-emerald-400" :
              uptimePercent >= 95 ? "text-amber-400" : "text-red-400"
            )}>
              {uptimePercent}%
            </span>
          )}
          {upLoading ? (
            <div className="h-2.5 w-2.5 rounded-full bg-zinc-700 animate-pulse" />
          ) : (
            <div
              className={clsx(
                "h-2.5 w-2.5 rounded-full ring-2",
                upData?.up
                  ? "bg-emerald-400 ring-emerald-900"
                  : "bg-red-500 ring-red-900"
              )}
              title={upData?.up ? `Online (HTTP ${upData.status})` : "Offline"}
            />
          )}
        </div>
      </div>

      {/* Metrics row */}
      <div className="mt-4 flex items-center gap-3">
        <StatusBadge variant={statusVariant} />

        <div className="flex items-center gap-1">
          <span className="text-xs text-zinc-500">PSI</span>
          {psLoading ? (
            <span className="text-xs text-zinc-600 animate-pulse">—</span>
          ) : (
            <span className={clsx("text-xs font-bold tabular-nums", getScoreColor(score))}>
              {score ?? "—"}
            </span>
          )}
        </div>

        {/* Deploy history dots */}
        {!ghLoading && ghData?.history?.length > 0 && (
          <div className="flex items-center gap-1 ml-auto" title="Laatste deploys (nieuwste links)">
            {ghData.history.map((run) => {
              const v = getStatusVariant(run.status, run.conclusion);
              return (
                <a
                  key={run.id}
                  href={run.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={clsx(
                    "block h-2 w-2 rounded-full hover:scale-125 transition-transform",
                    dotColor[v] ?? dotColor.unknown
                  )}
                  title={run.conclusion ?? run.status}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="mt-4 flex flex-wrap items-center gap-1 border-t border-zinc-800 pt-3">
        <QuickLink href={site.url} icon={ExternalLink} label="Live" />
        <QuickLink href={getGitHubActionsUrl(site.owner, site.repo)} icon={GithubIcon} label="Actions" />
        <QuickLink href={getGitHubUrl(site.owner, site.repo)} icon={GithubIcon} label="Repo" />
        <QuickLink href={getFirebaseConsoleUrl(site.firebaseProject)} icon={Flame} label="Firebase" />
      </div>
    </div>
  );
}
