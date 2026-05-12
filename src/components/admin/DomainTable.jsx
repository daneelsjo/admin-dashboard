// src/components/admin/DomainTable.jsx
import { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase";
import { differenceInDays, parseISO, format, isPast } from "date-fns";
import { Plus, Trash2, AlertTriangle, CheckCircle, Pencil } from "lucide-react";
import { clsx } from "clsx";

const COLLECTION = "domains";

function ExpiryBadge({ dateStr }) {
  if (!dateStr) return <span className="text-zinc-500 text-xs">—</span>;

  const date = parseISO(dateStr);
  const daysLeft = differenceInDays(date, new Date());
  const expired = isPast(date);

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        expired
          ? "border-red-800 bg-red-950 text-red-400"
          : daysLeft <= 30
          ? "border-amber-800 bg-amber-950 text-amber-400"
          : "border-zinc-700 bg-zinc-800 text-zinc-400"
      )}
    >
      {expired ? <AlertTriangle size={10} /> : daysLeft <= 30 ? <AlertTriangle size={10} /> : <CheckCircle size={10} />}
      {expired ? "Verlopen" : `${daysLeft}d`}
    </span>
  );
}

const emptyForm = { name: "", provider: "", expiryDate: "" };

export function DomainTable() {
  const [domains, setDomains] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Realtime Firestore listener
  useEffect(() => {
    const unsub = onSnapshot(collection(db, COLLECTION), (snap) => {
      setDomains(
        snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort(
          (a, b) => new Date(a.expiryDate) - new Date(b.expiryDate)
        )
      );
    });
    return unsub;
  }, []);

  // Waarschuwingen voor vervaldatums < 30 dagen
  const expiringSoon = domains.filter((d) => {
    if (!d.expiryDate) return false;
    const days = differenceInDays(parseISO(d.expiryDate), new Date());
    return days <= 30;
  });

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      if (editId) {
        await updateDoc(doc(db, COLLECTION, editId), { ...form, updatedAt: serverTimestamp() });
      } else {
        await addDoc(collection(db, COLLECTION), { ...form, createdAt: serverTimestamp() });
      }
      setForm(emptyForm);
      setEditId(null);
      setShowForm(false);
    } finally {
      setLoading(false);
    }
  }

  function startEdit(domain) {
    setForm({ name: domain.name, provider: domain.provider, expiryDate: domain.expiryDate });
    setEditId(domain.id);
    setShowForm(true);
  }

  async function handleDelete(id) {
    if (!confirm("Domein verwijderen?")) return;
    await deleteDoc(doc(db, COLLECTION, id));
  }

  return (
    <div className="space-y-4">
      {/* Expiry warning banner */}
      {expiringSoon.length > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-800 bg-amber-950/50 p-3">
          <AlertTriangle size={16} className="shrink-0 text-amber-400" />
          <p className="text-sm text-amber-300">
            <span className="font-semibold">{expiringSoon.length} domein(en)</span> verlopen binnen 30 dagen:{" "}
            {expiringSoon.map((d) => d.name).join(", ")}
          </p>
        </div>
      )}

      {/* Header + Add button */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">Domeinen & Hosting</h2>
        <button
          onClick={() => { setShowForm(!showForm); setEditId(null); setForm(emptyForm); }}
          className="flex items-center gap-1.5 rounded-lg bg-zinc-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-600 transition-colors"
        >
          <Plus size={13} />
          Toevoegen
        </button>
      </div>

      {/* Inline form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-3 rounded-xl border border-zinc-700 bg-zinc-800/50 p-4 sm:grid-cols-3"
        >
          {[
            { field: "name", placeholder: "Domeinnaam (bijv. mijnsite.be)", label: "Domein" },
            { field: "provider", placeholder: "Provider (bijv. TransIP)", label: "Provider" },
            { field: "expiryDate", placeholder: "", label: "Vervaldatum", type: "date" },
          ].map(({ field, placeholder, label, type = "text" }) => (
            <div key={field} className="space-y-1">
              <label className="text-xs text-zinc-400">{label}</label>
              <input
                type={type}
                required
                value={form[field]}
                onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                placeholder={placeholder}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-zinc-500 focus:outline-none"
              />
            </div>
          ))}
          <div className="flex items-end gap-2 sm:col-span-3">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-white px-4 py-2 text-xs font-semibold text-black hover:bg-zinc-200 transition-colors disabled:opacity-50"
            >
              {loading ? "Opslaan..." : editId ? "Bijwerken" : "Opslaan"}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setEditId(null); setForm(emptyForm); }}
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
              {["Domein", "Provider", "Vervaldatum", "Status", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-zinc-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {domains.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-zinc-600">
                  Nog geen domeinen toegevoegd.
                </td>
              </tr>
            )}
            {domains.map((domain) => (
              <tr
                key={domain.id}
                className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/30 transition-colors"
              >
                <td className="px-4 py-3 font-medium text-white">{domain.name}</td>
                <td className="px-4 py-3 text-zinc-400">{domain.provider}</td>
                <td className="px-4 py-3 text-zinc-400">
                  {domain.expiryDate
                    ? format(parseISO(domain.expiryDate), "dd MMM yyyy")
                    : "—"}
                </td>
                <td className="px-4 py-3">
                  <ExpiryBadge dateStr={domain.expiryDate} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => startEdit(domain)}
                      className="rounded p-1 text-zinc-500 hover:text-white transition-colors"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(domain.id)}
                      className="rounded p-1 text-zinc-500 hover:text-red-400 transition-colors"
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
