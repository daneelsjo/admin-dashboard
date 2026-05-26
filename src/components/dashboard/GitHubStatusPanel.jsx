// src/components/dashboard/GitHubStatusPanel.jsx
import { clsx } from "clsx";
import { formatDistanceToNow, parseISO } from "date-fns";
import { nl } from "date-fns/locale";
import { ExternalLink, RefreshCw, AlertTriangle, CheckCircle, Clock, Wrench } from "lucide-react";
import { useGitHubStatusPage } from "../../hooks/useGitHubStatusPage";
import { useQueryClient } from "@tanstack/react-query";

// ─── status mappings ────────────────────────────────────────────────────────

const COMPONENT_STATUS = {
  operational:          { label: "Operationeel",           dot: "bg-emerald-400", text: "text-emerald-400", badge: "border-emerald-800 bg-emerald-950/50 text-emerald-400" },
  degraded_performance: { label: "Verminderde prestaties", dot: "bg-amber-400",   text: "text-amber-400",   badge: "border-amber-800 bg-amber-950/50 text-amber-400" },
  partial_outage:       { label: "Gedeeltelijke storing",  dot: "bg-orange-400",  text: "text-orange-400",  badge: "border-orange-800 bg-orange-950/50 text-orange-400" },
  major_outage:         { label: "Grote storing",          dot: "bg-red-500",     text: "text-red-400",     badge: "border-red-800 bg-red-950/50 text-red-400" },
  under_maintenance:    { label: "Onderhoud",              dot: "bg-blue-400",    text: "text-blue-400",    badge: "border-blue-800 bg-blue-950/50 text-blue-400" },
};

const OVERALL = {
  none:     { label: "Alle systemen operationeel", border: "border-emerald-800/60", bg: "bg-emerald-950/30", text: "text-emerald-300", icon: CheckCircle,  iconColor: "text-emerald-400" },
  minor:    { label: "Kleine verstoring",          border: "border-amber-800/60",   bg: "bg-amber-950/30",   text: "text-amber-300",   icon: AlertTriangle, iconColor: "text-amber-400" },
  major:    { label: "Grote verstoring",           border: "border-orange-800/60",  bg: "bg-orange-950/30",  text: "text-orange-300",  icon: AlertTriangle, iconColor: "text-orange-400" },
  critical: { label: "Kritieke storing",           border: "border-red-800/60",     bg: "bg-red-950/30",     text: "text-red-300",     icon: AlertTriangle, iconColor: "text-red-400" },
};

const INCIDENT_STATUS = {
  investigating: { label: "Onderzoek",  color: "text-red-400"    },
  identified:    { label: "Vastgesteld", color: "text-orange-400" },
  monitoring:    { label: "Monitoring",  color: "text-amber-400"  },
  resolved:      { label: "Opgelost",   color: "text-emerald-400" },
  postmortem:    { label: "Postmortem", color: "text-zinc-400"    },
};

// ─── helpers ────────────────────────────────────────────────────────────────

function ComponentRow({ component }) {
  const cfg = COMPONENT_STATUS[component.status] ?? COMPONENT_STATUS.operational;
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-zinc-800/40 transition-colors">
      <span className="text-sm text-zinc-300">{component.name}</span>
      <span className={clsx(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium shrink-0",
        cfg.badge
      )}>
        <span className={clsx("h-1.5 w-1.5 rounded-full", cfg.dot)} />
        {cfg.label}
      </span>
    </div>
  );
}

function IncidentCard({ incident }) {
  const latest = incident.incident_updates?.[0];
  const statusCfg = INCIDENT_STATUS[incident.status] ?? INCIDENT_STATUS.investigating;
  return (
    <div className="rounded-xl border border-red-800/50 bg-red-950/20 p-4 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-white">{incident.name}</p>
        <span className={clsx("text-xs font-medium shrink-0", statusCfg.color)}>{statusCfg.label}</span>
      </div>
      {latest && (
        <p className="text-xs text-zinc-400 leading-relaxed">{latest.body}</p>
      )}
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1 text-xs text-zinc-600">
          <Clock size={10} />
          {formatDistanceToNow(parseISO(incident.updated_at), { addSuffix: true, locale: nl })}
        </span>
        {incident.shortlink && (
          <a
            href={incident.shortlink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-zinc-500 hover:text-white transition-colors"
          >
            <ExternalLink size={11} />
            Details
          </a>
        )}
      </div>
    </div>
  );
}

function MaintenanceCard({ maintenance }) {
  return (
    <div className="rounded-xl border border-blue-800/50 bg-blue-950/20 p-4 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-white">{maintenance.name}</p>
        <span className="text-xs font-medium text-blue-400 flex items-center gap-1 shrink-0">
          <Wrench size={11} />
          Gepland onderhoud
        </span>
      </div>
      {maintenance.incident_updates?.[0] && (
        <p className="text-xs text-zinc-400 leading-relaxed">{maintenance.incident_updates[0].body}</p>
      )}
      <span className="flex items-center gap-1 text-xs text-zinc-600">
        <Clock size={10} />
        {formatDistanceToNow(parseISO(maintenance.updated_at), { addSuffix: true, locale: nl })}
      </span>
    </div>
  );
}

// ─── main component ─────────────────────────────────────────────────────────

export function GitHubStatusPanel() {
  const queryClient = useQueryClient();
  const { data, isLoading, isFetching, isError, dataUpdatedAt } = useGitHubStatusPage();

  function reload() {
    queryClient.invalidateQueries({ queryKey: ["github-status-page"] });
  }

  if (isLoading) {
    return (
      <section>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-500">GitHub Status</h2>
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-12 rounded-xl border border-zinc-800 bg-zinc-900 animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-500">GitHub Status</h2>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-6 py-10 text-center">
          <p className="text-sm text-red-400">Kon GitHub status niet ophalen.</p>
          <button onClick={reload} className="mt-3 text-xs text-zinc-400 hover:text-white transition-colors underline">
            Opnieuw proberen
          </button>
        </div>
      </section>
    );
  }

  const overall    = data?.status;
  const components = (data?.components ?? []).filter((c) => !c.group && c.showcase !== false);
  const incidents  = data?.incidents ?? [];
  const maintenances = data?.scheduled_maintenances ?? [];
  const overallCfg = OVERALL[overall?.indicator] ?? OVERALL.none;
  const Icon = overallCfg.icon;

  // Sort: non-operational first
  const sorted = [...components].sort((a, b) => {
    const order = ["major_outage", "partial_outage", "degraded_performance", "under_maintenance", "operational"];
    return order.indexOf(a.status) - order.indexOf(b.status);
  });

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">GitHub Status</h2>
        <div className="flex items-center gap-3">
          {isFetching && <RefreshCw size={12} className="text-zinc-500 animate-spin" />}
          {dataUpdatedAt && (
            <span className="text-xs text-zinc-600">
              {formatDistanceToNow(dataUpdatedAt, { addSuffix: true })}
            </span>
          )}
          <button
            onClick={reload}
            title="Verversen"
            className="rounded p-1 text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            <RefreshCw size={12} />
          </button>
          <a
            href="https://www.githubstatus.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-zinc-500 hover:text-white transition-colors"
          >
            <ExternalLink size={12} />
            githubstatus.com
          </a>
        </div>
      </div>

      {/* Overall status banner */}
      <div className={clsx(
        "rounded-xl border px-5 py-4 flex items-center gap-3",
        overallCfg.border, overallCfg.bg
      )}>
        <Icon size={20} className={overallCfg.iconColor} />
        <div>
          <p className={clsx("text-base font-semibold", overallCfg.text)}>{overallCfg.label}</p>
          {overall?.description && overall.description !== overallCfg.label && (
            <p className="text-xs text-zinc-500 mt-0.5">{overall.description}</p>
          )}
        </div>
      </div>

      {/* Active incidents */}
      {incidents.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
            Actieve incidenten ({incidents.length})
          </h3>
          {incidents.map((inc) => <IncidentCard key={inc.id} incident={inc} />)}
        </div>
      )}

      {/* Scheduled maintenances */}
      {maintenances.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
            Gepland onderhoud ({maintenances.length})
          </h3>
          {maintenances.map((m) => <MaintenanceCard key={m.id} maintenance={m} />)}
        </div>
      )}

      {/* Component list */}
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">
          Componenten
        </h3>
        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 divide-y divide-zinc-800/60">
          {sorted.map((c) => <ComponentRow key={c.id} component={c} />)}
        </div>
      </div>
    </section>
  );
}
