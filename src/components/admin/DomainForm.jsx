// src/components/admin/DomainForm.jsx
// Standalone formulier voor het toevoegen of bewerken van een domein.
// Wordt gebruikt vanuit DomainTable.jsx

import { useState } from "react";
import { addDoc, updateDoc, doc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase";

const COLLECTION = "domains";
const emptyForm = { name: "", provider: "", expiryDate: "" };

export function DomainForm({ initial = null, editId = null, onDone }) {
  const [form, setForm] = useState(initial ?? emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (editId) {
        await updateDoc(doc(db, COLLECTION, editId), {
          ...form,
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, COLLECTION), {
          ...form,
          createdAt: serverTimestamp(),
        });
      }
      onDone?.();
    } catch (err) {
      setError("Opslaan mislukt: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  const fields = [
    {
      key: "name",
      label: "Domeinnaam",
      placeholder: "bijv. mijnsite.be",
      type: "text",
    },
    {
      key: "provider",
      label: "Provider",
      placeholder: "bijv. TransIP, Combell, One.com",
      type: "text",
    },
    {
      key: "expiryDate",
      label: "Vervaldatum",
      placeholder: "",
      type: "date",
    },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {fields.map(({ key, label, placeholder, type }) => (
        <div key={key} className="space-y-1">
          <label className="block text-xs text-zinc-400">{label}</label>
          <input
            type={type}
            required
            value={form[key]}
            onChange={handleChange(key)}
            placeholder={placeholder}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-zinc-500 focus:outline-none transition-colors"
          />
        </div>
      ))}

      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-white px-4 py-2 text-xs font-semibold text-black hover:bg-zinc-200 transition-colors disabled:opacity-50"
        >
          {loading ? "Opslaan..." : editId ? "Bijwerken" : "Toevoegen"}
        </button>
        <button
          type="button"
          onClick={() => onDone?.()}
          className="rounded-lg border border-zinc-700 px-4 py-2 text-xs text-zinc-400 hover:text-white transition-colors"
        >
          Annuleren
        </button>
      </div>
    </form>
  );
}
