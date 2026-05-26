// src/hooks/useGitHubStatusPage.js
import { useQuery } from "@tanstack/react-query";

async function fetchStatus() {
  const res = await fetch("https://www.githubstatus.com/api/v2/summary.json");
  if (!res.ok) throw new Error(`GitHub Status API: ${res.status}`);
  return res.json();
}

export function useGitHubStatusPage() {
  return useQuery({
    queryKey: ["github-status-page"],
    queryFn:  fetchStatus,
    staleTime:       1000 * 60 * 2,
    refetchInterval: 1000 * 60 * 5,
    retry: 2,
  });
}
