// src/hooks/useGitHubStatus.js
import { useQuery } from "@tanstack/react-query";

const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN;

async function fetchWorkflowStatus(owner, repo) {
  const headers = {
    Accept: "application/vnd.github+json",
    ...(GITHUB_TOKEN && { Authorization: `Bearer ${GITHUB_TOKEN}` }),
  };

  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/actions/runs?per_page=1`,
    { headers }
  );

  if (!res.ok) {
    if (res.status === 404) return { status: "not_found", conclusion: null, updatedAt: null };
    throw new Error(`GitHub API error: ${res.status}`);
  }

  const data = await res.json();
  const run = data.workflow_runs?.[0];

  if (!run) return { status: "no_runs", conclusion: null, updatedAt: null };

  return {
    status: run.status,       // "completed" | "in_progress" | "queued"
    conclusion: run.conclusion, // "success" | "failure" | "cancelled" | null
    updatedAt: run.updated_at,
    runUrl: run.html_url,
    name: run.name,
  };
}

// status → visuele variant mapping
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
    staleTime: 1000 * 60 * 2,   // 2 minuten cache
    refetchInterval: 1000 * 60 * 5, // elke 5 min verversen
    retry: 1,
  });
}
