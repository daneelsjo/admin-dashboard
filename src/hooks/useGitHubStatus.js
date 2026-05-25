// src/hooks/useGitHubStatus.js
// Calls the local proxy server — the GitHub token stays server-side.
import { useQuery } from "@tanstack/react-query";

async function fetchWorkflowStatus(owner, repo) {
  const res = await fetch(`/api/github/${owner}/${repo}/runs?per_page=1`);

  if (!res.ok) {
    if (res.status === 404) return { status: "not_found", conclusion: null, updatedAt: null };
    throw new Error(`API error: ${res.status}`);
  }

  const data = await res.json();
  const run = data.workflow_runs?.[0];

  if (!run) return { status: "no_runs", conclusion: null, updatedAt: null };

  return {
    status: run.status,
    conclusion: run.conclusion,
    updatedAt: run.updated_at,
    runUrl: run.html_url,
    name: run.name,
  };
}

export function getStatusVariant(status, conclusion) {
  if (status === "in_progress" || status === "queued") return "running";
  if (status === "completed") {
    if (conclusion === "success") return "success";
    if (conclusion === "failure") return "failure";
    return "warning";
  }
  return "unknown";
}

export function useGitHubStatus(owner, repo) {
  return useQuery({
    queryKey: ["github-status", owner, repo],
    queryFn: () => fetchWorkflowStatus(owner, repo),
    staleTime: 1000 * 60 * 2,
    refetchInterval: 1000 * 60 * 5,
    retry: 1,
  });
}
