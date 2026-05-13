// Date / status / format helpers — pulled verbatim from the original single-file app.

export function daysSince(d) {
  if (!d) return 0;
  return Math.floor((new Date() - new Date(d)) / 86400000);
}

export function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function statusLabel(s) {
  return {
    applied: 'Applied',
    screening: 'Screening',
    interview: 'Interview',
    offer: 'Offer',
    rejected: 'Rejected',
    ghosted: 'Ghosted',
  }[s] || s;
}

export function dotColor(s) {
  return {
    applied: '#b8b3a8',
    screening: '#b07a2c',
    interview: '#6b8baf',
    offer: '#5f7d50',
    rejected: '#b04a3a',
  }[s] || '#a39e93';
}

export function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
}

export function greeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Welcome back';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Working late';
}

export function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

// Format an ISO date `YYYY-MM-DD` from a Date.
export function isoDate(d = new Date()) {
  return d.toISOString().slice(0, 10);
}
