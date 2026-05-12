// src/components/dashboard/StatusBadge.jsx
import { clsx } from "clsx";
import { CheckCircle2, XCircle, Loader2, AlertCircle, HelpCircle } from "lucide-react";

const variants = {
  success: {
    className: "bg-emerald-950 text-emerald-400 border-emerald-800",
    Icon: CheckCircle2,
    label: "Deployed",
  },
  failure: {
    className: "bg-red-950 text-red-400 border-red-800",
    Icon: XCircle,
    label: "Failed",
  },
  running: {
    className: "bg-amber-950 text-amber-400 border-amber-800",
    Icon: Loader2,
    label: "Running",
    spin: true,
  },
  warning: {
    className: "bg-amber-950 text-amber-400 border-amber-800",
    Icon: AlertCircle,
    label: "Warning",
  },
  unknown: {
    className: "bg-zinc-800 text-zinc-400 border-zinc-700",
    Icon: HelpCircle,
    label: "Unknown",
  },
  not_found: {
    className: "bg-zinc-800 text-zinc-500 border-zinc-700",
    Icon: HelpCircle,
    label: "No Actions",
  },
};

export function StatusBadge({ variant = "unknown" }) {
  const { className, Icon, label, spin } = variants[variant] ?? variants.unknown;

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        className
      )}
    >
      <Icon size={12} className={clsx(spin && "animate-spin")} />
      {label}
    </span>
  );
}
