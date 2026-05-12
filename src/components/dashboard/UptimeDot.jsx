// src/components/dashboard/UptimeDot.jsx
import { clsx } from "clsx";
import { useUptimeCheck } from "../../hooks/useUptimeCheck";

export function UptimeDot({ url }) {
  const { data, isLoading } = useUptimeCheck(url);

  if (isLoading) {
    return (
      <span
        className="inline-block h-2.5 w-2.5 rounded-full bg-zinc-700 animate-pulse"
        title="Uptime controleren..."
      />
    );
  }

  const up = data?.up;
  const statusCode = data?.status;

  return (
    <span
      title={up ? `Online (HTTP ${statusCode ?? "200"})` : `Offline${statusCode ? ` (HTTP ${statusCode})` : ""}`}
      className={clsx(
        "inline-block h-2.5 w-2.5 rounded-full ring-2",
        up
          ? "bg-emerald-400 ring-emerald-900"
          : "bg-red-500 ring-red-900"
      )}
    />
  );
}
