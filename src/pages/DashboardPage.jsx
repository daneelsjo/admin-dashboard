// src/pages/DashboardPage.jsx
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { SiteCard } from "../components/dashboard/SiteCard";
import { DomainTable } from "../components/admin/DomainTable";
import { SITES } from "../config/sites";
import { Flame, LayoutGrid, Database, LogOut, RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const TABS = [
  { id: "overview", label: "Overzicht", Icon: LayoutGrid },
  { id: "domains", label: "Domeinen", Icon: Database },
];

export function DashboardPage() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const queryClient = useQueryClient();

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
            {TABS.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeTab === id
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-500 hover:text-white"
                }`}
              >
                <Icon size={13} />
                {label}
              </button>
            ))}
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
          {[
            { label: "Websites", value: SITES.length },
            { label: "Actief", value: SITES.length, sub: "monitored" },
            { label: "Regio", value: "EU", sub: "Firebase" },
            { label: "Stack", value: "React + Vite", sub: "dashboard" },
          ].map(({ label, value, sub }) => (
            <div key={label} className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3">
              <p className="text-xs text-zinc-500">{label}</p>
              <p className="mt-0.5 text-lg font-bold text-white">{value}</p>
              {sub && <p className="text-xs text-zinc-600">{sub}</p>}
            </div>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "overview" && (
          <section>
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-500">
              Websites ({SITES.length})
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {SITES.map((site) => (
                <SiteCard key={site.id} site={site} />
              ))}
            </div>
          </section>
        )}

        {activeTab === "domains" && (
          <section>
            <DomainTable />
          </section>
        )}
      </main>
    </div>
  );
}
