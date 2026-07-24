// Builds the deterministic "skeleton" from real Experience Bank rows (so
// headings/dates/org names are never at the mercy of the model), merges in
// the model's rewritten bullets, and renders the result to HTML/plain text.

import { fmtDateRange } from '@/lib/helpers';

const SECTION_ORDER = [
  { key: 'education', title: 'Education', types: ['education'] },
  { key: 'work', title: 'Experience', types: ['job', 'internship'] },
  { key: 'projects', title: 'Projects', types: ['project'] },
];

// Deterministic skeleton: title/heading/subheading/original bullets come
// straight from the database — the model never gets to invent or reorder these.
export function buildBankSkeleton(experiences) {
  const sorted = [...experiences].sort((a, b) => {
    const ad = a.start_date || '';
    const bd = b.start_date || '';
    return bd.localeCompare(ad);
  });

  return SECTION_ORDER.map(({ title, types }) => {
    const entries = sorted
      .filter((e) => types.includes(e.type))
      .map((e) => ({
        experience_id: e.id,
        heading: e.role && e.org ? `${e.role} — ${e.org}` : e.role || e.org || '',
        subheading: [fmtDateRange(e.start_date, e.end_date), e.location].filter(Boolean).join(' · '),
        original_bullets: (e.bullets || []).map((b) => b.text).filter(Boolean),
      }))
      .filter((e) => e.heading);
    return { title, entries };
  }).filter((section) => section.entries.length > 0);
}

// Merge the model's rewritten bullets into the skeleton. Every structural
// field (title, heading, subheading, order) always comes from the skeleton —
// the model's version of those fields, if it echoed them, is ignored.
export function mergeModelSections(skeletonSections, modelSections) {
  return skeletonSections.map((section, si) => {
    const modelSection = Array.isArray(modelSections) ? modelSections[si] : null;
    return {
      title: section.title,
      entries: section.entries.map((entry, ei) => {
        const modelEntry = modelSection?.entries?.[ei];
        const bullets =
          Array.isArray(modelEntry?.bullets) && modelEntry.bullets.every((b) => typeof b === 'string')
            ? modelEntry.bullets
            : entry.original_bullets;
        return {
          heading: entry.heading,
          subheading: entry.subheading,
          bullets,
        };
      }),
    };
  });
}

export function resumeJsonToPlainText(resume) {
  const lines = [];
  if (resume.name) lines.push(resume.name);
  if (resume.contact) lines.push(resume.contact);
  for (const section of resume.sections || []) {
    lines.push('', section.title.toUpperCase());
    for (const entry of section.entries || []) {
      const head = [entry.heading, entry.subheading].filter(Boolean).join('    ');
      lines.push(head);
      for (const bullet of entry.bullets || []) {
        lines.push(`- ${bullet}`);
      }
    }
  }
  if (resume.skills?.length) {
    lines.push('', 'SKILLS', ...resume.skills);
  }
  if (resume.additional?.length) {
    lines.push('', 'ADDITIONAL', ...resume.additional);
  }
  return lines.join('\n');
}

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function renderResumeHtml(resume) {
  const sectionsHtml = (resume.sections || [])
    .map(
      (section) => `
      <div class="section">
        <div class="section-title">${esc(section.title)}</div>
        ${(section.entries || [])
          .map(
            (entry) => `
          <div class="entry">
            <div class="entry-head">
              <span class="entry-heading">${esc(entry.heading)}</span>
              <span class="entry-subheading">${esc(entry.subheading)}</span>
            </div>
            ${
              entry.bullets?.length
                ? `<ul>${entry.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>`
                : ''
            }
          </div>`
          )
          .join('')}
      </div>`
    )
    .join('');

  const skillsHtml = resume.skills?.length
    ? `<div class="section">
        <div class="section-title">Skills</div>
        ${resume.skills.map((line) => `<div class="plain">${esc(line)}</div>`).join('')}
      </div>`
    : '';

  const additionalHtml = resume.additional?.length
    ? `<div class="section">
        <div class="section-title">Additional</div>
        <div class="plain">${esc(resume.additional.join(' · '))}</div>
      </div>`
    : '';

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  @page { size: Letter; margin: 0.5in; }
  * { box-sizing: border-box; }
  body {
    font-family: Georgia, 'Times New Roman', Times, serif;
    color: #1a1a1a;
    font-size: 9.7pt;
    line-height: 1.26;
    margin: 0;
  }
  .name {
    text-align: center;
    font-size: 18pt;
    font-weight: 700;
    letter-spacing: 0.02em;
    margin-bottom: 2pt;
  }
  .contact {
    text-align: center;
    font-size: 9pt;
    color: #333;
    margin-bottom: 9pt;
  }
  .section { margin-top: 7pt; }
  .section-title {
    font-size: 10pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-bottom: 0.75pt solid #1a1a1a;
    padding-bottom: 1.5pt;
    margin-bottom: 4pt;
  }
  .entry { margin-bottom: 5pt; }
  .entry-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 10pt;
  }
  .entry-heading { font-weight: 700; }
  .entry-subheading {
    font-style: italic;
    color: #333;
    white-space: nowrap;
    font-size: 9pt;
  }
  ul { margin: 2pt 0 0; padding-left: 13pt; }
  li { margin-bottom: 1.5pt; }
  .plain { font-size: 9.5pt; margin-bottom: 2pt; }
</style>
</head>
<body>
  <div class="name">${esc(resume.name)}</div>
  <div class="contact">${esc(resume.contact)}</div>
  ${sectionsHtml}
  ${skillsHtml}
  ${additionalHtml}
</body>
</html>`;
}
