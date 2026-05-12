// src/hooks/useUptimeCheck.js
// Directe fetch naar externe URLs faalt door CORS.
// We gebruiken allorigins.win als gratis proxy — of vervang door jouw
// eigen Firebase Cloud Function voor meer controle.
import { useQuery } from "@tanstack/react-query";

async function checkUptime(url) {
  try {
    const proxyUrl = `https://api.allorigins.win/head?url=${encodeURIComponent(url)}`;
    const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(8000) });

    if (!res.ok) return { up: false, status: res.status, latency: null };

    const data = await res.json();
    return {
      up: data.status?.http_code >= 200 && data.status?.http_code < 400,
      status: data.status?.http_code ?? null,
      latency: null, // allorigins geeft geen latency terug
    };
  } catch (err) {
    return { up: false, status: null, latency: null, error: err.message };
  }
}

export function useUptimeCheck(url) {
  return useQuery({
    queryKey: ["uptime", url],
    queryFn: () => checkUptime(url),
    staleTime: 1000 * 60 * 3,
    refetchInterval: 1000 * 60 * 5,
    retry: 0,
  });
}
