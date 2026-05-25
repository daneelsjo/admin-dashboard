// src/hooks/useUptimeCheck.js
import { useQuery } from "@tanstack/react-query";
import { recordUptimeCheck } from "./useUptimeHistory";

async function checkUptime(url) {
  try {
    // no-cors: browser sends request directly without needing CORS headers on the target.
    // Throws only on a real network failure (server down, DNS failure, timeout).
    // This avoids dependence on unreliable third-party CORS proxies.
    await fetch(url, {
      method: "HEAD",
      mode: "no-cors",
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    recordUptimeCheck(url, true);
    return { up: true, status: null };
  } catch {
    recordUptimeCheck(url, false);
    return { up: false, status: null };
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
