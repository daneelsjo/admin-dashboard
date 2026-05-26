# Onderhoudsgids — Admin Dashboard

Overzicht van alle systemen, waar je ze beheert en wat je wanneer moet bijwerken.

---

## 1. Admin Dashboard (deze app)

| | |
|---|---|
| **Repo** | `github.com/daneelsjo/admin-dashboard` |
| **Firebase project** | `admin-dashboard-5cf7a` |
| **Live URL** | Firebase Hosting (via GitHub Actions bij push naar `main`) |
| **Lokale dev** | `npm run dev` in deze map |

### Wat aanpassen?
- **Nieuwe website toevoegen** → tab *Websites* in het dashboard
- **Nieuw domein bijhouden** → tab *Domeinen*
- **Nieuwe API-sleutel registreren** → tab *API Keys*
- **Kanban site-tag toevoegen** → `src/services/kanbanService.js` → `SITE_TAGS` object

### Omgevingsvariabelen (`.env.local` + GitHub Secrets)

| Variabele | Wat | Waar ophalen |
|---|---|---|
| `VITE_FIREBASE_*` | Firebase configuratie | Firebase Console → admin-dashboard-5cf7a → Project Settings |
| `VITE_GITHUB_TOKEN` | GitHub API (Actions monitor) | github.com/settings/tokens |
| `VITE_PAGESPEED_API_KEY` | Google PageSpeed Insights | console.cloud.google.com → API's → Credentials |
| `VITE_KANBAN_API_URL` | URL van de feedbackApi Cloud Function | Firebase Console → feedback-widget → Functions |
| `VITE_KANBAN_API_KEY` | API-sleutel voor de feedbackApi | Google Cloud → feedback-widget → Secret Manager → `VALID_API_KEYS` |

> Elke variabele die hier staat moet ook als **GitHub Secret** staan in `admin-dashboard` (Settings → Secrets → Actions), anders werkt de productie-build niet.

---

## 2. Cloud Function — feedbackApi

| | |
|---|---|
| **Lokale map** | `C:\Users\jonathan.daneels\Desktop\Websites\melding_to_kanban\` |
| **Repo** | `github.com/daneelsjo/feedback-widget` |
| **Firebase project** | `feedback-widget-*` |
| **Regio** | `europe-west1` |
| **Deploy** | Automatisch via GitHub Actions bij push naar `main` |

### Wat aanpassen?

| Situatie | Bestand | Wat wijzigen |
|---|---|---|
| Nieuw kaarttype toevoegen | `functions/index.js` | `TYPE_IDS` object + label in `buildTitle` + validatielijst |
| Nieuwe API-sleutel toelaten | Google Cloud Secret Manager | Secret `VALID_API_KEYS` → nieuwe versie met extra key |
| Nieuw Kanban-bord | `functions/index.js` | Standaard `boardId` in de route aanpassen |

### Secrets (Google Cloud Secret Manager — project feedback-widget)

| Secret | Inhoud |
|---|---|
| `VALID_API_KEYS` | Kommalijst van geldige API-sleutels |
| `PRIVE_JO_SA_KEY` | Service account JSON voor toegang tot het Kanban Firestore-project |

---

## 3. Kanban-bord (Firestore)

De kaarten worden opgeslagen in de Firestore van het **prive-jo** project.

### Hardgecodeerde IDs (in `kanbanService.js`)

| Constante | ID | Betekenis |
|---|---|---|
| `BOARD_ID` | `XOhvgrJn3VYr7mR6vjsG` | Het Kanban-bord |
| `COLUMN_ID` | `NouTYAysQ5KsQkqGWXRx` | Kolom waar nieuwe kaarten in komen |
| `OWNER_UID` | `KNjbJuZV1MZMEUQKsViehVhW3832` | Eigenaar van de kaarten |

### Kaarttypen (TYPE_IDS in de Cloud Function)

| Type | ID |
|---|---|
| `bug` | `MEIipj89qLCIdKNcun28` |
| `improvement` | `gmlEYp5mzuhs4dATwhaB` |
| `feature` | `YKK54Dw5nureM74oat4q` |
| `task` | `R72KgziplDiwhcsfMfXN` |

### Site-tags (SITE_TAGS in `kanbanService.js`)

| Hostname | Tag ID |
|---|---|
| `localhost` | `9UL9hXvhnrjm3ulil59B` |
| `prive-jo.web.app` | `Tds44nUDMQq8XD1BKAKg` |
| `prive-jo-dev.web.app` | `Tds44nUDMQq8XD1BKAKg` |
| `optech-jo.web.app` | `9X8gSwm8hRyzLQimv2S6` |
| `optech-jo-dev.web.app` | `9X8gSwm8hRyzLQimv2S6` |

> Nieuwe site toevoegen? Voeg de hostname + tag ID toe aan `SITE_TAGS` in `src/services/kanbanService.js`.

---

## 4. Wanneer onderhouden?

| Wanneer | Wat doen |
|---|---|
| GitHub token vervalt (zie tab *API Keys*) | Nieuwe token aanmaken op github.com/settings/tokens en updaten in `.env.local` + GitHub Secret |
| PageSpeed API key vervalt | Vernieuwen via Google Cloud Console |
| Kanban API key roteren | Nieuwe key toevoegen aan Secret `VALID_API_KEYS` (nieuwe versie), dan `.env.local` + GitHub Secret updaten |
| Nieuwe website live | Toevoegen via tab *Websites*, en hostname + tag ID toevoegen aan `SITE_TAGS` als Kanban-integratie gewenst is |
| Nieuw kaarttype nodig in Kanban | ID ophalen uit Kanban Firestore, toevoegen aan `TYPE_IDS` in Cloud Function én aan `TYPES` array in `MaintenanceTaskDialog.jsx` |
| Firebase project verloopt of migreert | Firebase Console → nieuw project → alle `VITE_FIREBASE_*` vars updaten |

---

## 5. Lokale ontwikkeling starten

```bash
# In de map van het admin dashboard:
npm run dev
```

Vite start op `http://localhost:5173` en proxiet `/api`-calls naar de lokale Express-server op poort 3001.

De `.env.local` moet aanwezig zijn met alle variabelen uit sectie 1.
