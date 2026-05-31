// src/hooks/useDomains.js
import { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

export function useDomains() {
  const [domains, setDomains] = useState([]);

  useEffect(() => {
    return onSnapshot(collection(db, "domains"), (snap) => {
      setDomains(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""))
      );
    });
  }, []);

  return domains;
}
