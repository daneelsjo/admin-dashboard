// src/hooks/usePageSpeed.js
import { useQuery } from "@tanstack/react-query";

const PSI_API_KEY  = import.meta.env.VITE_PAGESPEED_API_KEY;
const CACHE_TTL    = 1000 * 60 * 60 * 24; // 24 uur
const cacheKey     = (url) => `psi-v1-${btoa(url).slice(0, 20)}`;

function readCache(url) {
  try {
    const cached = JSON.parse(localStorage.getItem(cacheKey(url)));
    if (cached && Date.now() - cached.t < CACHE_TTL) return { data: cached.data, t: cached.t };
  } catch {}
  return null;
}

function writeCache(url, data) {
  try {
    localStorage.setItem(cacheKey(url), JSON.stringify({ t: Date.now(), data }));
  } catch {}
}

async function fetchPageSpeed(url) {
  const endpoint = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
  endpoint.searchParams.set("url", url);
  endpoint.searchParams.set("strategy", "mobile");
  endpoint.searchParams.set("category", "performance");
  if (PSI_API_KEY) endpoint.searchParams.set("key", PSI_API_KEY);

  const res = await fetch(endpoint.toString());
  if (!res.ok) throw new Error(`PageSpeed API error: ${res.status}`);

  const data  = await res.json();
  const score = data.lighthouseResult?.categories?.performance?.score;

  const result = {
    score: score != null ? Math.round(score * 100) : null,
    fcp: data.lighthouseResult?.audits?.["first-contentful-paint"]?.displayValue,
    lcp: data.lighthouseResult?.audits?.["largest-contentful-paint"]?.displayValue,
    cls: data.lighthouseResult?.audits?.["cumulative-layout-shift"]?.displayValue,
  };

  writeCache(url, result);
  return result;
}

export function getScoreColor(score) {
  if (score === null) return "text-gray-400";
  if (score >= 90) return "text-emerald-400";
  if (score >= 50) return "text-amber-400";
  return "text-red-400";
}

export function getScoreBg(score) {
  if (score === null) return "bg-gray-800";
  if (score >= 90) return "bg-emerald-950 border-emerald-800";
  if (score >= 50) return "bg-amber-950 border-amber-800";
  return "bg-red-950 border-red-800";
}

export function usePageSpeed(url) {
  const cached = readCache(url);
  return useQuery({
    queryKey: ["pagespeed", url],
    queryFn: () => fetchPageSpeed(url),
    staleTime: CACHE_TTL,
    initialData: cached?.data,
    initialDataUpdatedAt: cached?.t ?? 0,
    retry: 1,
  });
}
