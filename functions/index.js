// functions/index.js — Firebase Cloud Function: GitHub API proxy
// The GITHUB_TOKEN secret is stored in Firebase Secret Manager and
// never exposed to the browser.
import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import express from "express";
import cors from "cors";

const GITHUB_TOKEN = defineSecret("GITHUB_TOKEN");

const app = express();
app.use(cors({ origin: true }));

// GET /api/github/:owner/:repo/runs?per_page=N
app.get("/api/github/:owner/:repo/runs", async (req, res) => {
  const { owner, repo } = req.params;
  const perPage = Math.min(parseInt(req.query.per_page) || 5, 25);

  const token = GITHUB_TOKEN.value();
  const headers = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "admin-dashboard-proxy/1.0",
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/actions/runs?per_page=${perPage}`,
      { headers }
    );

    if (response.status === 404) {
      return res.json({ workflow_runs: [] });
    }
    if (!response.ok) {
      return res.status(response.status).json({ error: `GitHub API ${response.status}` });
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export const api = onRequest({ secrets: [GITHUB_TOKEN] }, app);
