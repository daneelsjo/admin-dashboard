// src/hooks/useGitHubStatus.js
import { useQuery } from "@tanstack/react-query";

const IS_PROD    = import.meta.env.PROD;
const VITE_TOKEN = import.meta.env.VITE_GITHUB_TOKEN;

async function fetchWorkflowStatus(owner, repo) {
  let url, headers = {};
  if (IS_PROD) {
    url = `https://api.github.com/repos/${owner}/${repo}/actions/runs?per_page=5`;
    headers = {
      Accept: "application/vnd.github+json",
      ...(VITE_TOKEN && { Authorization: `Bearer ${VITE_TOKEN}` }),
    };
  } else {
    url = `/api/github/${owner}/${repo}/runs?per_page=5`;
  }

  const res = await fetch(url, { headers });
  if (!res.ok) {
    if (res.status === 404) return { status: "not_found", conclusion: null, history: [] };
    throw new Error(`GitHub API error: ${res.status}`);
  }

  const data  = await res.json();
  const runs  = data.workflow_runs ?? [];
  const run   = runs[0];

  if (!run) return { status: "no_runs", conclusion: null, history: [] };

  return {
    status:     run.status,
    conclusion: run.conclusion,
    updatedAt:  run.updated_at,
    runUrl:     run.html_url,
    name:       run.name,
    history:    runs.map((r) => ({
      id:         r.id,
      status:     r.status,
      conclusion: r.conclusion,
      url:        r.html_url,
    })),
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
    queryFn:  () => fetchWorkflowStatus(owner, repo),
    staleTime: 1000 * 60 * 2,
    refetchInterval: 1000 * 60 * 5,
    retry: 1,
  });
}
