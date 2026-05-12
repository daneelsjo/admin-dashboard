// src/components/dashboard/PerformanceScore.jsx
import { clsx } from "clsx";
import { usePageSpeed } from "../../hooks/usePageSpeed";

function scoreColor(score) {
  if (score === null) return { text: "text-zinc-500", ring: "stroke-zinc-700" };
  if (score >= 90) return { text: "text-emerald-400", ring: "stroke-emerald-400" };
  if (score >= 50) return { text: "text-amber-400", ring: "stroke-amber-400" };
  return { text: "text-red-400", ring: "stroke-red-400" };
}

// Kleine SVG-cirkel als visuele score-indicator
function ScoreRing({ score }) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const progress = score !== null ? (score / 100) * circumference : 0;
  const { text, ring } = scoreColor(score);

  return (
    <div className="relative flex items-center justify-center">
      <svg width="48" height="48" className="-rotate-90">
        <circle
          cx="24" cy="24" r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          className="text-zinc-800"
        />
        <circle
          cx="24" cy="24" r={radius}
          fill="none"
          strokeWidth="3"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          className={clsx("transition-all duration-700", ring)}
        />
      </svg>
      <span className={clsx("absolute text-xs font-bold tabular-nums", text)}>
        {score ?? "—"}
      </span>
    </div>
  );
}

export function PerformanceScore({ url }) {
  const { data, isLoading, isError } = usePageSpeed(url);

  if (isLoading) {
    return (
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-zinc-800 animate-pulse" />
        <span className="text-xs text-zinc-600">Laden...</span>
      </div>
    );
  }

  if (isError || !data) {
    return <span className="text-xs text-zinc-600">PSI niet beschikbaar</span>;
  }

  return (
    <div className="flex items-center gap-3">
      <ScoreRing score={data.score} />
      <div className="space-y-0.5">
        <p className="text-xs text-zinc-500">Performance</p>
        {data.fcp && <p className="text-xs text-zinc-400">FCP: {data.fcp}</p>}
        {data.lcp && <p className="text-xs text-zinc-400">LCP: {data.lcp}</p>}
      </div>
    </div>
  );
}
