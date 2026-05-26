// src/hooks/useTokens.js
import { useState, useEffect } from "react";
import {
  collection, onSnapshot, addDoc, updateDoc,
  deleteDoc, doc, serverTimestamp, query, orderBy,
} from "firebase/firestore";
import { db } from "../firebase";

const COLLECTION = "tokens";

export function useTokens() {
  const [tokens, setTokens]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, COLLECTION), orderBy("expiryDate", "asc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setTokens(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      () => setLoading(false)
    );
    return unsub;
  }, []);

  const addToken    = (data) => addDoc(collection(db, COLLECTION), { ...data, createdAt: serverTimestamp() });
  const updateToken = (id, data) => updateDoc(doc(db, COLLECTION, id), { ...data, updatedAt: serverTimestamp() });
  const deleteToken = (id) => deleteDoc(doc(db, COLLECTION, id));

  return { tokens, loading, addToken, updateToken, deleteToken };
}
