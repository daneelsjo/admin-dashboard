// src/components/admin/SiteForm.jsx
import { useState } from "react";
import { useSites } from "../../hooks/useSites";
import { Plus, Pencil, Trash2, ExternalLink, X } from "lucide-react";
import { clsx } from "clsx";
import { ConfirmDialog } from "../ui/ConfirmDialog";

const emptyForm = {
  name: "",
  description: "",
  url: "",
  owner: "",
  repo: "",
  firebaseProject: "",
  notes: "",
  siteTagId: "",
};

const FIELDS = [
  { name: "name",            label: "Naam",               placeholder: "Optech werksite",           required: true,  col: 1 },
  { name: "url",             label: "Live URL",            placeholder: "https://mijnsite.be/",      required: true,  col: 1 },
  { name: "description",     label: "Omschrijving",        placeholder: "Korte beschrijving",         required: false, col: 2 },
  { name: "owner",           label: "GitHub owner",        placeholder: "daneelsjo",                 required: true,  col: 1 },
  { name: "repo",            label: "GitHub repository",   placeholder: "mijn-repo-naam",            required: true,  col: 1 },
  { name: "firebaseProject", label: "Firebase project ID", placeholder: "mijn-project-id",           required: false, col: 2 },
  { name: "siteTagId",       label: "Kanban site-tag ID",  placeholder: "Firestore tag-document ID", required: false, col: 2 },
  { name: "notes",           label: "Notities",            placeholder: "Klant: X · staging · ...", required: false, col: 2, textarea: true },
];

export function SiteForm() {
  const { sites, loading, addSite, updateSite, deleteSite } = useSites();
  const [form, setForm]           = useState(emptyForm);
  const [editId, setEditId]       = useState(null);
  const [showForm, setShowForm]   = useState(false);
  const [saving, setSaving]       = useState(false);
  const [confirmItem, setConfirmItem] = useState(null); // { id, name }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId) {
        await updateSite(editId, form);
      } else {
        await addSite(form);
      }
      resetForm();
    } finally {
      setSaving(false);
    }
  }

  function startEdit(site) {
    setForm({
      name:            site.name            ?? "",
      description:     site.description     ?? "",
      url:             site.url             ?? "",
      owner:           site.owner           ?? "",
      repo:            site.repo            ?? "",
      firebaseProject: site.firebaseProject ?? "",
      notes:           site.notes           ?? "",
      siteTagId:       site.siteTagId       ?? "",
    });
    setEditId(site.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setForm(emptyForm);
    setEditId(null);
    setShowForm(false);
  }

  async function confirmDelete() {
    await deleteSite(confirmItem.id);
    setConfirmItem(null);
  }

  return (
    <div className="space-y-4">
      <ConfirmDialog
        open={!!confirmItem}
        title="Website verwijderen"
        message={`"${confirmItem?.name}" permanent verwijderen uit het dashboard? Dit kan niet ongedaan worden gemaakt.`}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmItem(null)}
        danger
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">Websites beheren</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Websites die je hier toevoegt verschijnen automatisch in het overzicht en de GitHub Actions monitor.
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
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-5 space-y-4"
        >
          <p className="text-xs font-semibold text-zinc-300 uppercase tracking-wide">
            {editId ? "Website bewerken" : "Nieuwe website"}
          </p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {FIELDS.map(({ name, label, placeholder, required, col, textarea }) => (
              <div key={name} className={clsx("space-y-1", col === 2 && "sm:col-span-2")}>
                <label className="text-xs text-zinc-400">
                  {label}
                  {!required && <span className="ml-1 text-zinc-600">(optioneel)</span>}
                </label>
                {textarea ? (
                  <textarea
                    name={name}
                    value={form[name]}
                    onChange={handleChange}
                    placeholder={placeholder}
                    rows={2}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-zinc-500 focus:outline-none transition-colors resize-none"
                  />
                ) : (
                  <input
                    type="text"
                    name={name}
                    value={form[name]}
                    onChange={handleChange}
                    placeholder={placeholder}
                    required={required}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-zinc-500 focus:outline-none transition-colors"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-1 border-t border-zinc-700">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-white px-4 py-2 text-xs font-semibold text-black hover:bg-zinc-200 transition-colors disabled:opacity-50"
            >
              {saving ? "Opslaan..." : editId ? "Bijwerken" : "Toevoegen"}
            </button>
            <button
              type="button"
              onClick={resetForm}
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
              {["Naam", "URL", "GitHub repo", "Firebase", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-zinc-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-xs text-zinc-600 animate-pulse">
                  Laden...
                </td>
              </tr>
            )}
            {!loading && sites.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center">
                  <p className="text-sm text-zinc-500">Nog geen websites toegevoegd.</p>
                  <p className="text-xs text-zinc-600 mt-1">
                    Klik op "Toevoegen" hierboven om je eerste website toe te voegen.
                  </p>
                </td>
              </tr>
            )}
            {sites.map((site) => (
              <tr
                key={site.id}
                className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/30 transition-colors"
              >
                <td className="px-4 py-3">
                  <p className="font-medium text-white text-sm">{site.name}</p>
                  {site.description && (
                    <p className="text-xs text-zinc-500 mt-0.5">{site.description}</p>
                  )}
                  {site.notes && (
                    <p className="text-xs text-zinc-600 italic mt-0.5">{site.notes}</p>
                  )}
                </td>
                <td className="px-4 py-3">
                  {site.url ? (
                    <a
                      href={site.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                    >
                      <ExternalLink size={11} />
                      {site.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                    </a>
                  ) : (
                    <span className="text-xs text-zinc-600">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs font-mono text-zinc-400">
                  {site.owner && site.repo ? `${site.owner}/${site.repo}` : "—"}
                </td>
                <td className="px-4 py-3 text-xs text-zinc-500">
                  {site.firebaseProject || "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => startEdit(site)}
                      title="Bewerken"
                      className="rounded p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-700 transition-colors"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => setConfirmItem({ id: site.id, name: site.name })}
                      title="Verwijderen"
                      className="rounded p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-700 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
