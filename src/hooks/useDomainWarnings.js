// src/hooks/useDomainWarnings.js
import { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { differenceInDays, parseISO, isPast } from "date-fns";

export function useDomainWarnings() {
  const [expiring, setExpiring] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "domains"), (snap) => {
      const soon = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((d) => {
          if (!d.expiryDate) return false;
          const days = differenceInDays(parseISO(d.expiryDate), new Date());
          return isPast(parseISO(d.expiryDate)) || days <= 30;
        });
      setExpiring(soon);
    });
    return unsub;
  }, []);

  return expiring;
}
