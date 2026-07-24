// Date / status / format helpers — pulled verbatim from the original single-file app.

export function daysSince(d) {
  if (!d) return 0;
  return Math.floor((new Date() - new Date(d)) / 86400000);
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

// Parses "YYYY-MM-DD" (or "YYYY-MM") directly instead of via `new Date(...)`,
// which parses date-only ISO strings as UTC and then renders calendar fields
// (month/day/year) in the local timezone — shifting the displayed date back
// by one for anyone west of UTC.
export function fmtDate(d) {
  if (!d) return '—';
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(d);
  if (!match) return '—';
  const [, , month, day] = match;
  const idx = Number(month) - 1;
  if (idx < 0 || idx > 11) return '—';
  return `${MONTH_NAMES[idx]} ${Number(day)}`;
}

export function fmtMonthYear(d) {
  if (!d) return '';
  const match = /^(\d{4})-(\d{2})/.exec(d);
  if (!match) return '';
  const [, year, month] = match;
  const idx = Number(month) - 1;
  if (idx < 0 || idx > 11) return '';
  return `${MONTH_NAMES[idx]} ${year}`;
}

export function fmtDateRange(start, end) {
  const s = fmtMonthYear(start);
  if (!s) return '';
  // No end date and the start date hasn't happened yet → hasn't started,
  // so "Present" would be wrong (e.g. an incoming program that starts next fall).
  if (!end && start && new Date(start).getTime() > Date.now()) {
    return `Incoming ${s}`;
  }
  const e = end ? fmtMonthYear(end) : 'Present';
  return `${s} – ${e}`;
}

export function statusLabel(s) {
  return {
    applied: 'Applied',
    screening: 'Screening',
    interview: 'Interview',
    offer: 'Offer',
    closed: 'Closed',
  }[s] || s;
}

export function dotColor(s) {
  return {
    applied: '#94A3B8',
    screening: '#6B93B8',
    interview: '#4E7FA8',
    offer: '#1E4E8C',
    closed: '#64748B',
  }[s] || '#64748B';
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
