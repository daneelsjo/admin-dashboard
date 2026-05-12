// src/config/sites.js
// Vervang dit met jouw echte projecten.
// owner = jouw GitHub username, repo = repository naam
// firebaseProject = jouw Firebase project-ID

export const SITES = [
  {
    id: "Prive",
    name: "Prive",
    url: "https://prive-jo.web.app/",
    owner: "daneelsjo",
    repo: "Prive_jo_clean",
    firebaseProject: "prive-jo",
    description: "Persoonlijk werk site",
  },
  {
    id: "Optech site",
    name: "Optech werksite",
    url: "https://optech-jo.web.app/",
    owner: "daneelsjo",
    repo: "optech-site",
    firebaseProject: "optech-jo",
    description: "Persoonlijk werk site",
  },
];

// Quick Link generators
export const getGitHubUrl = (owner, repo) =>
  `https://github.com/${owner}/${repo}`;

export const getFirebaseConsoleUrl = (projectId) =>
  `https://console.firebase.google.com/project/${projectId}/hosting/sites`;

export const getGitHubActionsUrl = (owner, repo) =>
  `https://github.com/${owner}/${repo}/actions`;
