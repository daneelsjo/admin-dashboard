// src/services/kanbanService.js
// Schrijft onderhoudstaken naar het Kanban-bord via de bestaande feedbackApi Cloud Function.

const API_URL = import.meta.env.VITE_KANBAN_API_URL;
const API_KEY  = import.meta.env.VITE_KANBAN_API_KEY;

// IDs afkomstig uit de bestaande widget-configuratie
const BOARD_ID  = 'XOhvgrJn3VYr7mR6vjsG';
const COLUMN_ID = 'NouTYAysQ5KsQkqGWXRx';
const OWNER_UID = 'KNjbJuZV1MZMEUQKsViehVhW3832';

export function isKanbanConfigured() {
  return !!(API_URL && API_KEY);
}

export async function sendMaintenanceTaskToKanban({ label, notes, siteName, intervalLabel, userEmail, siteTagId, type = 'improvement' }) {
  if (!isKanbanConfigured()) throw new Error('VITE_KANBAN_API_URL of VITE_KANBAN_API_KEY niet ingesteld.');

  const lines = [
    notes || '(geen opmerkingen)',
    '',
    '---',
    '🔧 Terugkerende onderhoudstaak via Admin Dashboard',
    siteName      ? `Website: ${siteName}`       : '',
    intervalLabel ? `Interval: ${intervalLabel}` : '',
  ].filter(Boolean);

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
  if (siteTagId) body.siteTagId = siteTagId;

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
