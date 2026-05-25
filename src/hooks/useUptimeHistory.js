// src/hooks/useUptimeHistory.js
// Slaat uptime-checks op in localStorage (max 288 = 24u aan 5min-intervallen).
// recordUptimeCheck() wordt aangeroepen vanuit useUptimeCheck na elke check.
import { useState, useEffect } from "react";

const MAX = 288;
const key = (url) => `uptime-${btoa(url).slice(0, 20)}`;

export function recordUptimeCheck(url, up) {
  try {
    const prev = JSON.parse(localStorage.getItem(key(url))) ?? [];
    prev.push({ t: Date.now(), up });
    localStorage.setItem(key(url), JSON.stringify(prev.slice(-MAX)));
  } catch {}
}

export function useUptimePercent(url) {
  const [percent, setPercent] = useState(null);

  useEffect(() => {
    function calc() {
      try {
        const all = JSON.parse(localStorage.getItem(key(url))) ?? [];
        const cutoff = Date.now() - 24 * 60 * 60 * 1000;
        const recent = all.filter((e) => e.t >= cutoff);
        if (recent.length < 3) { setPercent(null); return; }
        setPercent(Math.round((recent.filter((e) => e.up).length / recent.length) * 100));
      } catch { setPercent(null); }
    }
    calc();
    const id = setInterval(calc, 1000 * 60 * 5);
    return () => clearInterval(id);
  }, [url]);

  return percent;
}
