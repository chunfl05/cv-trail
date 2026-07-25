// Best-effort duplicate detection for resume-import: flags a likely-existing
// experience for the user to confirm during import review. This is a fuzzy
// heuristic (org + role text overlap + a close start date), not a precise
// dedupe — it never silently skips or merges anything on its own, it only
// flags a candidate match for the user to decide on in the import preview.

function normalize(s) {
  return (s || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ');
}

function textOverlaps(a, b) {
  if (!a || !b) return false;
  return a === b || a.includes(b) || b.includes(a);
}

function monthsBetween(d1, d2) {
  const m1 = /^(\d{4})-(\d{2})/.exec(d1 || '');
  const m2 = /^(\d{4})-(\d{2})/.exec(d2 || '');
  if (!m1 || !m2) return Infinity;
  const total1 = Number(m1[1]) * 12 + Number(m1[2]);
  const total2 = Number(m2[1]) * 12 + Number(m2[2]);
  return Math.abs(total1 - total2);
}

// Returns the first existing experience that looks like the same real
// experience as `candidate` (a freshly-parsed import item), or null.
export function findDuplicateMatch(candidate, existingExperiences) {
  const org = normalize(candidate.org);
  const role = normalize(candidate.role);
  if (!org || !role) return null;
  for (const exp of existingExperiences || []) {
    if (!textOverlaps(org, normalize(exp.org))) continue;
    if (!textOverlaps(role, normalize(exp.role))) continue;
    if (monthsBetween(candidate.start_date, exp.start_date) <= 2) return exp;
  }
  return null;
}

// Unions bullet text (by normalized text, so trivial rewording doesn't
// create a near-duplicate), keeping the existing bullets first.
export function mergeBullets(existingBullets, newBulletTexts) {
  const seen = new Set((existingBullets || []).map((b) => normalize(b.text)));
  const merged = [...(existingBullets || [])];
  for (const text of newBulletTexts || []) {
    const key = normalize(text);
    if (key && !seen.has(key)) {
      seen.add(key);
      merged.push({ text, tags: [] });
    }
  }
  return merged;
}

export function mergeTechStack(existingStack, newStack) {
  const seen = new Set((existingStack || []).map((t) => normalize(t)));
  const merged = [...(existingStack || [])];
  for (const t of newStack || []) {
    const key = normalize(t);
    if (key && !seen.has(key)) {
      seen.add(key);
      merged.push(t);
    }
  }
  return merged;
}
