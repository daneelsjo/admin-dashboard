// src/components/admin/TokenTable.jsx
import { useState } from "react";
import { differenceInDays, parseISO, format, isPast } from "date-fns";
import { Plus, Trash2, Pencil, ExternalLink, AlertTriangle, CheckCircle, Key, X } from "lucide-react";
import { clsx } from "clsx";
import { useTokens } from "../../hooks/useTokens";
import { useSites } from "../../hooks/useSites";
import { ConfirmDialog } from "../ui/ConfirmDialog";

function ExpiryBadge({ dateStr }) {
  if (!dateStr) return <span className="text-zinc-600 text-xs">—</span>;
  const date     = parseISO(dateStr);
  const daysLeft = differenceInDays(date, new Date());
  const expired  = isPast(date);
  return (
    <span className={clsx(
      "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
      expired       ? "border-red-800 bg-red-950 text-red-400"
      : daysLeft <= 7  ? "border-red-800 bg-red-950 text-red-400"
      : daysLeft <= 30 ? "border-amber-800 bg-amber-950 text-amber-400"
      :                  "border-zinc-700 bg-zinc-800 text-zinc-400"
    )}>
      {expired || daysLeft <= 30 ? <AlertTriangle size={10} /> : <CheckCircle size={10} />}
      {expired ? "Verlopen" : `${daysLeft}d`}
    </span>
  );
}

const emptyForm = {
  label: "", service: "", siteId: "", expiryDate: "", renewUrl: "", instructions: "",
};

export function TokenTable() {
  const { tokens, loading, addToken, updateToken, deleteToken } = useTokens();
  const { sites } = useSites();

  const [form, setForm]           = useState(emptyForm);
  const [editId, setEditId]       = useState(null);
  const [showForm, setShowForm]   = useState(false);
  const [saving, setSaving]       = useState(false);
  const [confirmItem, setConfirmItem] = useState(null);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      editId ? await updateToken(editId, form) : await addToken(form);
      resetForm();
    } finally {
      setSaving(false);
    }
  }

  function startEdit(token) {
    setForm({
      label:        token.label        ?? "",
      service:      token.service      ?? "",
      siteId:       token.siteId       ?? "",
      expiryDate:   token.expiryDate   ?? "",
      renewUrl:     token.renewUrl     ?? "",
      instructions: token.instructions ?? "",
    });
    setEditId(token.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setForm(emptyForm);
    setEditId(null);
    setShowForm(false);
  }

  async function confirmDelete() {
    await deleteToken(confirmItem.id);
    setConfirmItem(null);
  }

  const siteName = (id) => sites.find((s) => s.id === id)?.name ?? "—";

  return (
    <div className="space-y-4">
      <ConfirmDialog
        open={!!confirmItem}
        title="Token verwijderen"
        message={`"${confirmItem?.label}" permanent verwijderen? Dit kan niet ongedaan worden gemaakt.`}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmItem(null)}
        danger
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">API Keys &amp; Tokens</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Houd per sleutel bij wanneer ze vervallen, hoe je ze vernieuwt en waar je de nieuwe waarde invoert.
            Sla de token-waarden zelf <span className="text-zinc-400 font-medium">niet</span> hier op.
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm((v) => !v); }}
          className="flex items-center gap-1.5 rounded-lg bg-zinc-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-600 transition-colors shrink-0"
        >
          {showForm && !editId ? <X size={13} /> : <Plus size={13} />}
          {showForm && !editId ? "Annuleren" : "Toevoegen"}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-5 space-y-4">
          <p className="text-xs font-semibold text-zinc-300 uppercase tracking-wide">
            {editId ? "Token bewerken" : "Nieuwe token"}
          </p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* Label */}
            <div className="space-y-1">
              <label className="text-xs text-zinc-400">Label <span className="text-red-500">*</span></label>
              <input
                name="label" value={form.label} onChange={handleChange} required
                placeholder="GitHub PAT (Actions read-only)"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-zinc-500 focus:outline-none"
              />
            </div>

            {/* Service */}
            <div className="space-y-1">
              <label className="text-xs text-zinc-400">Service <span className="text-zinc-600">(optioneel)</span></label>
              <input
                name="service" value={form.service} onChange={handleChange}
                placeholder="GitHub / Google Cloud / Firebase"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-zinc-500 focus:outline-none"
              />
            </div>

            {/* Site */}
            <div className="space-y-1">
              <label className="text-xs text-zinc-400">Website <span className="text-zinc-600">(optioneel)</span></label>
              <select
                name="siteId" value={form.siteId} onChange={handleChange}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-zinc-500 focus:outline-none"
              >
                <option value="">Globaal (niet site-specifiek)</option>
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Expiry date */}
            <div className="space-y-1">
              <label className="text-xs text-zinc-400">Vervaldatum <span className="text-zinc-600">(optioneel)</span></label>
              <input
                type="date" name="expiryDate" value={form.expiryDate} onChange={handleChange}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-zinc-500 focus:outline-none"
              />
            </div>

            {/* Renew URL */}
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs text-zinc-400">Vernieuwen via <span className="text-zinc-600">(optioneel)</span></label>
              <input
                name="renewUrl" value={form.renewUrl} onChange={handleChange}
                placeholder="https://github.com/settings/personal-access-tokens"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-zinc-500 focus:outline-none"
              />
            </div>

            {/* Instructions */}
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs text-zinc-400">Instructies <span className="text-zinc-600">(optioneel)</span></label>
              <textarea
                name="instructions" value={form.instructions} onChange={handleChange} rows={3}
                placeholder="Genereer nieuwe token → kopieer → plak in GitHub Secret VITE_GITHUB_TOKEN → herstart deploy"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-zinc-500 focus:outline-none resize-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1 border-t border-zinc-700">
            <button
              type="submit" disabled={saving}
              className="rounded-lg bg-white px-4 py-2 text-xs font-semibold text-black hover:bg-zinc-200 transition-colors disabled:opacity-50"
            >
              {saving ? "Opslaan..." : editId ? "Bijwerken" : "Toevoegen"}
            </button>
            <button
              type="button" onClick={resetForm}
              className="rounded-lg border border-zinc-700 px-4 py-2 text-xs text-zinc-400 hover:text-white transition-colors"
            >
              Annuleren
            </button>
          </div>
        </form>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/50">
              {["Token / Service", "Website", "Vervalt", "Status", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-zinc-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-xs text-zinc-600 animate-pulse">Laden...</td>
              </tr>
            )}
            {!loading && tokens.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Key size={24} className="text-zinc-700" />
                    <p className="text-sm text-zinc-500">Nog geen tokens toegevoegd.</p>
                    <p className="text-xs text-zinc-600">Klik op "Toevoegen" om je eerste API key bij te houden.</p>
                  </div>
                </td>
              </tr>
            )}
            {tokens.map((token) => {
              const expired  = token.expiryDate ? isPast(parseISO(token.expiryDate)) : false;
              const daysLeft = token.expiryDate ? differenceInDays(parseISO(token.expiryDate), new Date()) : null;
              const urgent   = daysLeft !== null && daysLeft <= 7;
              return (
                <tr
                  key={token.id}
                  className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Key size={13} className={clsx(
                        expired || urgent ? "text-red-400" : daysLeft !== null && daysLeft <= 30 ? "text-amber-400" : "text-zinc-500"
                      )} />
                      <div>
                        <p className="font-medium text-white text-sm">{token.label}</p>
                        {token.service && <p className="text-xs text-zinc-500">{token.service}</p>}
                        {token.instructions && (
                          <p className="text-xs text-zinc-600 mt-0.5 italic max-w-xs truncate">{token.instructions}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-400">
                    {token.siteId ? siteName(token.siteId) : <span className="text-zinc-600">Globaal</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-400">
                    {token.expiryDate ? format(parseISO(token.expiryDate), "dd MMM yyyy") : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <ExpiryBadge dateStr={token.expiryDate} />
                      {token.renewUrl && (
                        <a
                          href={token.renewUrl} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-zinc-500 hover:text-white flex items-center gap-0.5 transition-colors"
                          title="Vernieuwen"
                        >
                          <ExternalLink size={11} />
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => startEdit(token)}
                        className="rounded p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-700 transition-colors"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => setConfirmItem({ id: token.id, label: token.label })}
                        className="rounded p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-700 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
