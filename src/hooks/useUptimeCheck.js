// src/hooks/useUptimeCheck.js
import { useQuery } from "@tanstack/react-query";
import { recordUptimeCheck } from "./useUptimeHistory";

async function checkUptime(url) {
  try {
    const proxyUrl = `https://api.allorigins.win/head?url=${encodeURIComponent(url)}`;
    const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) {
      recordUptimeCheck(url, false);
      return { up: false, status: res.status, latency: null };
    }
    const data = await res.json();
    const up = data.status?.http_code >= 200 && data.status?.http_code < 400;
    recordUptimeCheck(url, up);
    return { up, status: data.status?.http_code ?? null, latency: null };
  } catch (err) {
    recordUptimeCheck(url, false);
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
