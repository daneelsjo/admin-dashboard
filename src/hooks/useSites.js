// src/hooks/useSites.js
// Real-time Firestore hook for the "sites" collection.
import { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase";

const COLLECTION = "sites";

export function useSites() {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, COLLECTION), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setSites(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      () => setLoading(false)
    );
    return unsub;
  }, []);

  const addSite = (data) =>
    addDoc(collection(db, COLLECTION), { ...data, createdAt: serverTimestamp() });

  const updateSite = (id, data) =>
    updateDoc(doc(db, COLLECTION, id), { ...data, updatedAt: serverTimestamp() });

  const deleteSite = (id) => deleteDoc(doc(db, COLLECTION, id));

  return { sites, loading, addSite, updateSite, deleteSite };
}
