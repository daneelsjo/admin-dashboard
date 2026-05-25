// api/index.js — GitHub proxy server
// Runs server-side: the GITHUB_TOKEN never reaches the browser.
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';

dotenv.config({ path: '.env.local' });

const app = express();
const PORT = process.env.API_PORT || 3001;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

if (!GITHUB_TOKEN) {
  console.warn('[API] GITHUB_TOKEN not set — requests will be unauthenticated (rate-limited to 60/hr).');
}

// Only allow the Vite dev server to call this proxy.
app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }));

function githubHeaders() {
  const h = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'admin-dashboard-proxy/1.0',
  };
  if (GITHUB_TOKEN) h.Authorization = `Bearer ${GITHUB_TOKEN}`;
  return h;
}

// GET /api/github/:owner/:repo/runs?per_page=N
app.get('/api/github/:owner/:repo/runs', async (req, res) => {
  const { owner, repo } = req.params;
  const perPage = Math.min(parseInt(req.query.per_page) || 5, 25);

  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/actions/runs?per_page=${perPage}`,
      { headers: githubHeaders() }
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

app.listen(PORT, () => {
  console.log(`[API] GitHub proxy → http://localhost:${PORT}`);
});
