// src/config/sites.js
// Vervang dit met jouw echte projecten.
// owner = jouw GitHub username, repo = repository naam
// firebaseProject = jouw Firebase project-ID

export const SITES = [
  {
    id: "portfolio",
    name: "Portfolio",
    url: "https://jouwportfolio.be",
    owner: "jouw-github-username",
    repo: "portfolio",
    firebaseProject: "portfolio-abc123",
    description: "Persoonlijk portfolio & CV",
  },
  {
    id: "business-site",
    name: "Bedrijfswebsite",
    url: "https://jouwbedrijf.be",
    owner: "jouw-github-username",
    repo: "business-website",
    firebaseProject: "business-site-xyz789",
    description: "Commerciële website",
  },
  {
    id: "blog",
    name: "Blog",
    url: "https://blog.jouwdomein.be",
    owner: "jouw-github-username",
    repo: "personal-blog",
    firebaseProject: "blog-def456",
    description: "Technische blog",
  },
];

// Quick Link generators
export const getGitHubUrl = (owner, repo) =>
  `https://github.com/${owner}/${repo}`;

export const getFirebaseConsoleUrl = (projectId) =>
  `https://console.firebase.google.com/project/${projectId}/hosting/sites`;

export const getGitHubActionsUrl = (owner, repo) =>
  `https://github.com/${owner}/${repo}/actions`;
