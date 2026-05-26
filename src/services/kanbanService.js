// src/services/kanbanService.js
// Schrijft onderhoudstaken naar het Kanban-bord via de bestaande feedbackApi Cloud Function.

const API_URL = import.meta.env.VITE_KANBAN_API_URL;
const API_KEY  = import.meta.env.VITE_KANBAN_API_KEY;

// IDs afkomstig uit de bestaande widget-configuratie
const BOARD_ID  = 'XOhvgrJn3VYr7mR6vjsG';
const COLUMN_ID = 'NouTYAysQ5KsQkqGWXRx';
const OWNER_UID = 'KNjbJuZV1MZMEUQKsViehVhW3832';

// Hostname → Kanban site-tag ID
const SITE_TAGS = {
  'localhost':             '9UL9hXvhnrjm3ulil59B',
  'prive-jo.web.app':      'Tds44nUDMQq8XD1BKAKg',
  'optech-jo.web.app':     '9X8gSwm8hRyzLQimv2S6',
  'optech-jo-dev.web.app': '9X8gSwm8hRyzLQimv2S6',
  'prive-jo-dev.web.app':  'Tds44nUDMQq8XD1BKAKg',
};

const RECURRENCE_MAP = {
  'Wekelijks':       'weekly',
  'Tweewekelijks':   'biweekly',
  'Maandelijks':     'monthly',
  'Driemaandelijks': 'quarterly',
  'Jaarlijks':       'yearly',
};

function resolveSiteTagId(siteUrl, manualOverride) {
  if (manualOverride) return manualOverride;
  try {
    const hostname = new URL(siteUrl).hostname;
    return SITE_TAGS[hostname] || null;
  } catch {
    return null;
  }
}

export function isKanbanConfigured() {
  return !!(API_URL && API_KEY);
}

export async function sendMaintenanceTaskToKanban({ label, notes, siteName, siteUrl, intervalLabel, userEmail, siteTagId, type = 'task' }) {
  if (!isKanbanConfigured()) throw new Error('VITE_KANBAN_API_URL of VITE_KANBAN_API_KEY niet ingesteld.');

  const lines = [
    notes || '(geen opmerkingen)',
    '',
    '---',
    '🔧 Terugkerende onderhoudstaak via Admin Dashboard',
    siteName      ? `Website: ${siteName}`       : '',
    intervalLabel ? `Interval: ${intervalLabel}` : '',
  ].filter(Boolean);

  const resolvedTagId = resolveSiteTagId(siteUrl, siteTagId);

  const body = {
    type:           type,
    subject:        label,
    name:           'Admin Dashboard',
    email:          userEmail || 'admin@dashboard',
    description:    lines.join('\n'),
    boardId:        BOARD_ID,
    statusId:       COLUMN_ID,
    ownerUid:       OWNER_UID,
    sourceSiteName: siteName || 'Admin Dashboard',
  };
  if (resolvedTagId) body.siteTagId = resolvedTagId;
  if (intervalLabel) body.recurrence = RECURRENCE_MAP[intervalLabel] ?? intervalLabel.toLowerCase();

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || `Kanban API fout: ${res.status}`);
  }
}
