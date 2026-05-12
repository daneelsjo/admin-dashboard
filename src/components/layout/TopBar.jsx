// src/components/layout/TopBar.jsx
import { Flame, LogOut, RefreshCw } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";

const TABS = [
  { id: "overview", label: "Overzicht" },
  { id: "domains", label: "Domeinen" },
];

export function TopBar({ activeTab, onTabChange }) {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();

  return (
    <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Flame size={16} className="text-orange-400" />
          <span className="text-sm font-semibold text-white">Admin Dashboard</span>
        </div>

        {/* Tab navigatie */}
        <nav className="flex items-center gap-1">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                activeTab === id
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-500 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        {/* Acties rechts */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => queryClient.invalidateQueries()}
            title="Alles verversen"
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <RefreshCw size={14} />
          </button>
          <span className="hidden text-xs text-zinc-600 sm:block">{user?.email}</span>
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
  );
}
