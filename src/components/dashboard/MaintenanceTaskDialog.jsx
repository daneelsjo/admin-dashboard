// src/components/dashboard/MaintenanceTaskDialog.jsx
import { useState } from "react";
import { clsx } from "clsx";
import { X, Wrench, Send, AlertCircle, CheckCircle } from "lucide-react";
import { sendMaintenanceTaskToKanban, isKanbanConfigured } from "../../services/kanbanService";
import { useAuth } from "../../contexts/AuthContext";

const INTERVALS = [
  { value: "Wekelijks",    label: "Wekelijks"    },
  { value: "Tweewekelijks", label: "Tweewekelijks" },
  { value: "Maandelijks",  label: "Maandelijks"  },
  { value: "Driemaandelijks", label: "Driemaandelijks" },
  { value: "Jaarlijks",   label: "Jaarlijks"    },
];

export function MaintenanceTaskDialog({ site, onClose }) {
  const { user } = useAuth();
  const [label, setLabel]       = useState("");
  const [notes, setNotes]       = useState("");
  const [interval, setInterval] = useState("Maandelijks");
  const [status, setStatus]     = useState(null); // null | "sending" | "ok" | "error"
  const [errorMsg, setErrorMsg] = useState("");

  if (!isKanbanConfigured()) {
    return (
      <Backdrop onClose={onClose}>
        <div className="space-y-3">
          <Header onClose={onClose} />
          <div className="rounded-lg border border-amber-800/60 bg-amber-950/40 px-4 py-3 text-xs text-amber-300">
            <p className="font-semibold mb-1">Kanban niet geconfigureerd</p>
            <p className="text-amber-400/80">
              Voeg <code className="font-mono">VITE_KANBAN_API_URL</code> en{" "}
              <code className="font-mono">VITE_KANBAN_API_KEY</code> toe aan je{" "}
              <code className="font-mono">.env.local</code>.
            </p>
          </div>
        </div>
      </Backdrop>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!label.trim()) return;
    setStatus("sending");
    try {
      await sendMaintenanceTaskToKanban({
        label:         label.trim(),
        notes:         notes.trim(),
        siteName:      site?.name,
        intervalLabel: interval,
        userEmail:     user?.email,
      });
      setStatus("ok");
    } catch (err) {
      setErrorMsg(err.message ?? "Onbekende fout");
      setStatus("error");
    }
  }

  if (status === "ok") {
    return (
      <Backdrop onClose={onClose}>
        <div className="space-y-4">
          <Header onClose={onClose} />
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle size={36} className="text-emerald-400" />
            <p className="text-sm font-semibold text-white">Taak aangemaakt!</p>
            <p className="text-xs text-zinc-500">De onderhoudstaak staat nu op het Kanban-bord.</p>
          </div>
          <button
            onClick={onClose}
            className="w-full rounded-lg bg-zinc-800 px-4 py-2 text-sm text-white hover:bg-zinc-700 transition-colors"
          >
            Sluiten
          </button>
        </div>
      </Backdrop>
    );
  }

  return (
    <Backdrop onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Header onClose={onClose} />

        {site && (
          <p className="text-xs text-zinc-500">
            Website: <span className="text-zinc-300 font-medium">{site.name}</span>
          </p>
        )}

        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Taakomschrijving *</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="bijv. SSL-certificaat vernieuwen"
            required
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-zinc-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Interval</label>
          <select
            value={interval}
            onChange={(e) => setInterval(e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-zinc-500 focus:outline-none"
          >
            {INTERVALS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Opmerkingen</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Optionele toelichting of stappen…"
            className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-zinc-500 focus:outline-none"
          />
        </div>

        {status === "error" && (
          <div className="flex items-start gap-2 rounded-lg border border-red-800/60 bg-red-950/30 px-3 py-2">
            <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
            <p className="text-xs text-red-400">{errorMsg}</p>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
          >
            Annuleren
          </button>
          <button
            type="submit"
            disabled={status === "sending" || !label.trim()}
            className={clsx(
              "flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              status === "sending" || !label.trim()
                ? "bg-zinc-700 text-zinc-500 cursor-not-allowed"
                : "bg-zinc-100 text-zinc-900 hover:bg-white"
            )}
          >
            <Send size={13} />
            {status === "sending" ? "Versturen…" : "Naar Kanban"}
          </button>
        </div>
      </form>
    </Backdrop>
  );
}

function Backdrop({ onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl">
        {children}
      </div>
    </div>
  );
}

function Header({ onClose }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Wrench size={15} className="text-zinc-400" />
        <h2 className="text-sm font-semibold text-white">Onderhoudstaak aanmaken</h2>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="rounded p-1 text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
}
