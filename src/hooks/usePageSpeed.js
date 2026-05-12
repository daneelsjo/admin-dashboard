// src/hooks/usePageSpeed.js
import { useQuery } from "@tanstack/react-query";

const PSI_API_KEY = import.meta.env.VITE_PAGESPEED_API_KEY;

async function fetchPageSpeed(url) {
  const endpoint = new URL(
    "https://www.googleapis.com/pagespeedonline/v5/runPagespeed"
  );
  endpoint.searchParams.set("url", url);
  endpoint.searchParams.set("strategy", "mobile");
  endpoint.searchParams.set("category", "performance");
  if (PSI_API_KEY) endpoint.searchParams.set("key", PSI_API_KEY);

  const res = await fetch(endpoint.toString());
  if (!res.ok) throw new Error(`PageSpeed API error: ${res.status}`);

  const data = await res.json();
  const score = data.lighthouseResult?.categories?.performance?.score;

  return {
    score: score != null ? Math.round(score * 100) : null,
    fcp: data.lighthouseResult?.audits?.["first-contentful-paint"]?.displayValue,
    lcp: data.lighthouseResult?.audits?.["largest-contentful-paint"]?.displayValue,
    cls: data.lighthouseResult?.audits?.["cumulative-layout-shift"]?.displayValue,
  };
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
  return useQuery({
    queryKey: ["pagespeed", url],
    queryFn: () => fetchPageSpeed(url),
    staleTime: 1000 * 60 * 30, // 30 min cache (PSI calls zijn duur)
    retry: 1,
  });
}
