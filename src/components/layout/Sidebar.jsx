// src/components/layout/Sidebar.jsx
// Optionele zijbalk — momenteel niet actief gebruikt (navigatie zit in TopBar).
// Klaar om in te schakelen als je meer pagina's toevoegt.

import { LayoutGrid, Database, Settings, Flame } from "lucide-react";
import { clsx } from "clsx";

const NAV_ITEMS = [
  { id: "overview", label: "Overzicht", Icon: LayoutGrid },
  { id: "domains", label: "Domeinen", Icon: Database },
  { id: "settings", label: "Instellingen", Icon: Settings },
];

export function Sidebar({ activeTab, onTabChange }) {
  return (
    <aside className="flex h-screen w-56 flex-col border-r border-zinc-800 bg-zinc-950 px-3 py-4">
      {/* Logo */}
      <div className="mb-6 flex items-center gap-2 px-2">
        <Flame size={18} className="text-orange-400" />
        <span className="text-sm font-semibold text-white">Admin Dashboard</span>
      </div>

      {/* Nav items */}
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={clsx(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-left",
              activeTab === id
                ? "bg-zinc-800 text-white"
                : "text-zinc-500 hover:bg-zinc-900 hover:text-white"
            )}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
