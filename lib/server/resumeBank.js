// Pure business logic for building a tailored resume from the Experience
// Bank: partitioning must-include vs. candidate experiences, the prompts,
// and reconciling the model's response back against real DB rows. Kept
// separate from app/api/tailor-resume/route.js so it's independently testable
// without a live Next.js request/Supabase session.

import { fmtDateRange } from '@/lib/helpers';

export const CANONICAL_SKILL_CATEGORIES = [
  'Programming',
  'Statistical Methods',
  'Data & Visualization',
  'Tools',
];

export const BANK_SYSTEM_PROMPT = `You are a resume-building assistant. You select and tailor content from a user's real Experience Bank to build a one-page resume for a specific job description (JD).

You will receive:
1. MUST-INCLUDE entries — these will always appear on the resume no matter what (education entries and the user's current full-time job). You cannot drop them or add new ones, but you must still rewrite their bullets to fit the JD.
2. CANDIDATE entries — past jobs, internships, and projects. You choose which of these to include and which to leave out.
3. The job description (JD).
4. Optionally, a list of skill category names to reorder by relevance.

YOUR GOAL IS A FULL PAGE, NOT A MINIMAL ONE:
- Default to INCLUDING a candidate. Only exclude one if it is clearly irrelevant to the JD (e.g., unrelated retail/food-service work with no transferable skills) or if the page is genuinely full after you've already included everything more relevant.
- A one-page resume with 2 education entries, one already-included current job, and this template's compact spacing typically has room for ALL of a person's real professional jobs (not just the current one) plus 2-3 real projects, each with 2-3 concise bullets. Do not preemptively cut down to just one or two candidates out of excess caution — an empty half-page is a worse outcome than a full one.
- Prioritize keeping candidates that demonstrate a combined marketing + data background — that combination is central to how this user wants to be positioned — but this is a tiebreaker for genuinely borderline cases, not a license to drop other real, relevant experience.
- When you do need to cut something to fit, cut the single least-relevant candidate, or trim a bullet count, rather than aggressively excluding multiple candidates at once.

CRITICAL RULES:
- Only use the real entries and real bullets given to you. NEVER invent an employer, title, project, date, metric, or skill that isn't present in the data you were given.
- For EVERY entry that will appear on the final resume (both MUST-INCLUDE entries and the CANDIDATEs you selected), rewrite its bullets to mirror the JD's language and emphasis. Rewriting means rephrasing the user's REAL bullets — never adding a fact, metric, or achievement that isn't a reworded version of one of the original bullets for that entry. You may drop a bullet that isn't relevant, but never invent a new one.
- For each rewritten bullet, you may mark at most 1-2 of its most JD-relevant keywords, tools, or quantified results for bolding. Only choose exact substrings that appear verbatim in the bullet text you wrote for "bold" — most bullets should have 0-1 bolded spans; never bold a large portion of a bullet.
- Do not exaggerate numbers or seniority.

Output ONLY a single valid JSON object, with no preamble, no explanation, and no markdown code fences. The JSON must match exactly this shape:

{
  "match_score": <integer 0-100, how well the user's real background fits this JD>,
  "selected_experience_ids": [<ids of the CANDIDATE entries you chose to include, strings>],
  "bullets": {
    "<experience_id>": [ { "text": "<rewritten bullet>", "bold": [<0-2 exact substrings of "text" to bold>] } ]
  },
  "skills_order": [<category name strings, reordered by JD relevance — omit or return an empty array if you weren't given any categories>]
}

"bullets" must have an entry for every MUST-INCLUDE id and every id you put in "selected_experience_ids". Return nothing but the JSON object.`;

export const UPLOAD_SYSTEM_PROMPT = `You are a resume-building assistant. You rewrite a user's real, existing resume (given as raw extracted text) into a structured, tailored resume for a specific job description (JD).

CRITICAL RULES:
- Only use content present in the resume text. NEVER invent employers, titles, dates, metrics, skills, or achievements that are not present in it.
- Preserve the resume's real entries, organization/school names, titles, and dates exactly as given in the source text — do not add or remove entries.
- Rewrite bullet wording to mirror the JD's language and emphasis — never add facts that aren't there.
- For each rewritten bullet, you may mark at most 1-2 of its most JD-relevant keywords, tools, or quantified results for bolding — exact substrings of the bullet text you wrote, in a "bold" array. Most bullets should have 0-1 bolded spans.
- If the JD calls for something the resume does not evidence, do NOT add it — it simply isn't reflected. Never fabricate coverage.
- Do not exaggerate numbers, dates, or seniority.

Output ONLY a single valid JSON object, with no preamble, no explanation, and no markdown code fences. The JSON must match exactly this shape:

{
  "match_score": <integer 0-100, how well the ORIGINAL resume fits this JD>,
  "name": "<the person's real name from the resume>",
  "phone": "<real phone number from the resume, or empty string>",
  "email": "<real email from the resume, or empty string>",
  "education": [ { "org": "<school>", "role": "<degree>", "location": "<string>", "start_date": "<YYYY-MM-01>", "end_date": "<YYYY-MM-01 or empty if ongoing/future>", "bullets": [] } ],
  "experience": [ { "org": "<company>", "role": "<title>", "location": "<string>", "start_date": "<YYYY-MM-01>", "end_date": "<YYYY-MM-01 or empty if current>", "bullets": [ { "text": "<rewritten bullet>", "bold": [] } ] } ],
  "projects": [ { "role": "<project name>", "tech_stack": [<strings>], "start_date": "<YYYY-MM-01 or empty>", "end_date": "<YYYY-MM-01 or empty>", "bullets": [ { "text": "<rewritten bullet>", "bold": [] } ] } ],
  "skills": { "<category name from the resume, if it has one>": [<strings>] }
}

Dates: the resume typically only states month and year — always output "YYYY-MM-01" (day is always 01), including the full year. If a field has no content, use an empty array/object/string — never omit a field. Return nothing but the JSON object.`;

export function isCurrentFullTimeJob(e) {
  return e.type === 'job' && !e.end_date;
}

export function partitionExperiences(experiences) {
  const mustInclude = [];
  const candidates = [];
  for (const e of experiences) {
    if (e.type === 'education' || isCurrentFullTimeJob(e)) {
      mustInclude.push(e);
    } else {
      candidates.push(e);
    }
  }
  return { mustInclude, candidates };
}

export function summarizeEntry(e) {
  return {
    id: e.id,
    org: e.org,
    role: e.role,
    type: e.type,
    start_date: e.start_date,
    end_date: e.end_date,
    location: e.location,
    tech_stack: e.tech_stack || [],
    tags: e.tags || [],
    original_bullets: (e.bullets || []).map((b) => b.text).filter(Boolean),
  };
}

export function buildBankUserMessage({ mustInclude, candidates, skillCategories, jdText }) {
  return [
    `You have ${mustInclude.length} MUST-INCLUDE entries and ${candidates.length} CANDIDATE entries available. Remember: default to including candidates — a full page beats an empty one.`,
    '',
    'MUST-INCLUDE ENTRIES (always appear; rewrite bullets only, do not drop):',
    JSON.stringify(mustInclude.map(summarizeEntry), null, 2),
    '',
    'CANDIDATE ENTRIES (select which of these to include — default to including unless clearly irrelevant or the page is genuinely full):',
    JSON.stringify(candidates.map(summarizeEntry), null, 2),
    '',
    skillCategories.length
      ? `SKILL CATEGORIES (order these by JD relevance): ${JSON.stringify(skillCategories)}`
      : 'SKILL CATEGORIES: none provided — omit "skills_order" or return an empty array.',
    '',
    'JOB DESCRIPTION:',
    jdText,
  ].join('\n');
}

export function resolveSkills(profile) {
  const profileSkills = profile?.skills;
  const hasProfileSkills =
    profileSkills &&
    typeof profileSkills === 'object' &&
    Object.values(profileSkills).some((v) => Array.isArray(v) && v.length);
  if (hasProfileSkills) {
    const skillsByCategory = {};
    for (const cat of CANONICAL_SKILL_CATEGORIES) {
      if (Array.isArray(profileSkills[cat]) && profileSkills[cat].length) {
        skillsByCategory[cat] = profileSkills[cat];
      }
    }
    // Keep any custom category names the user added beyond the canonical four.
    for (const [cat, values] of Object.entries(profileSkills)) {
      if (!skillsByCategory[cat] && Array.isArray(values) && values.length) {
        skillsByCategory[cat] = values;
      }
    }
    return { skillsByCategory, hasProfileSkills: true };
  }
  return { skillsByCategory: {}, hasProfileSkills: false };
}

export function sortByStartDesc(a, b) {
  return (b.start_date || '').localeCompare(a.start_date || '');
}

export function toRenderEntry(e, bullets) {
  return {
    org: e.org,
    role: e.role,
    location: e.location,
    start_date: e.start_date,
    end_date: e.end_date,
    tech_stack: e.tech_stack || [],
    bullets,
  };
}

// Reconciles the model's bank-mode response against the real experiences,
// returning the final education/experience/projects arrays plus resolved
// skills. Ids the model invents or that aren't in `experiences` are dropped
// silently rather than trusted.
export function reconcileBankResponse({ experiences, mustInclude, parsed, profile }) {
  const byId = new Map(experiences.map((e) => [e.id, e]));
  const mustIncludeIds = new Set(mustInclude.map((e) => e.id));
  const selectedIds = Array.isArray(parsed.selected_experience_ids)
    ? parsed.selected_experience_ids.filter((id) => byId.has(id) && !mustIncludeIds.has(id))
    : [];
  const finalIds = new Set([...mustIncludeIds, ...selectedIds]);

  const resolveBullets = (e) => {
    const original = (e.bullets || [])
      .map((b) => ({ text: b.text, bold: [] }))
      .filter((b) => b.text);
    const modelBullets = parsed.bullets?.[e.id];
    if (Array.isArray(modelBullets) && modelBullets.every((b) => b && typeof b.text === 'string')) {
      return modelBullets.map((b) => ({
        text: b.text,
        bold: Array.isArray(b.bold) ? b.bold.filter((k) => typeof k === 'string') : [],
      }));
    }
    return original;
  };

  const finalExperiences = experiences.filter((e) => finalIds.has(e.id));
  const education = finalExperiences
    .filter((e) => e.type === 'education')
    .sort(sortByStartDesc)
    .map((e) => toRenderEntry(e, resolveBullets(e)));
  const experience = finalExperiences
    .filter((e) => e.type === 'job' || e.type === 'internship')
    .sort(sortByStartDesc)
    .map((e) => toRenderEntry(e, resolveBullets(e)));
  const projects = finalExperiences
    .filter((e) => e.type === 'project')
    .sort(sortByStartDesc)
    .map((e) => toRenderEntry(e, resolveBullets(e)));

  const { skillsByCategory: resolvedSkills, hasProfileSkills } = resolveSkills(profile);
  let skillsByCategory;
  let skillsOrder;
  if (hasProfileSkills) {
    skillsByCategory = resolvedSkills;
    skillsOrder = Array.isArray(parsed.skills_order)
      ? parsed.skills_order.filter((c) => Object.prototype.hasOwnProperty.call(resolvedSkills, c))
      : undefined;
  } else {
    const aggregated = Array.from(
      new Set(finalExperiences.flatMap((e) => [...(e.tech_stack || []), ...(e.tags || [])]))
    );
    skillsByCategory = aggregated.length ? { Skills: aggregated } : {};
  }

  return { education, experience, projects, skillsByCategory, skillsOrder };
}

// Builds an HTML-preview-friendly resumeJson from the same final structured
// data used for the LaTeX output (plain-text bullets — bold spans are a
// LaTeX-only detail on this secondary quick-preview surface).
export function toHtmlResumeJson({ name, contact, education, experience, projects, skillsByCategory, skillsOrder }) {
  const sectionize = (title, entries) => ({
    title,
    entries: entries.map((e) => ({
      heading: e.role && e.org ? `${e.role} — ${e.org}` : e.role || e.org || '',
      subheading: [fmtDateRange(e.start_date, e.end_date), e.location].filter(Boolean).join(' · '),
      bullets: (e.bullets || []).map((b) => b.text),
    })),
  });
  const categories = (skillsOrder?.length ? skillsOrder : Object.keys(skillsByCategory)).filter(
    (c) => skillsByCategory[c]?.length
  );
  return {
    name,
    contact,
    sections: [
      sectionize('Education', education),
      sectionize('Professional Experience', experience),
      sectionize('Project Experience', projects),
    ].filter((s) => s.entries.length > 0),
    skills: categories.flatMap((c) => [`${c}: ${skillsByCategory[c].join(', ')}`]),
    additional: [],
  };
}

export function normalizeUploadEntries(arr) {
  return Array.isArray(arr)
    ? arr
        .map((e) => ({
          org: e.org || '',
          role: e.role || '',
          location: e.location || '',
          start_date: e.start_date || null,
          end_date: e.end_date || null,
          tech_stack: Array.isArray(e.tech_stack) ? e.tech_stack : [],
          bullets: Array.isArray(e.bullets)
            ? e.bullets
                .filter((b) => b && typeof b.text === 'string')
                .map((b) => ({
                  text: b.text,
                  bold: Array.isArray(b.bold) ? b.bold.filter((k) => typeof k === 'string') : [],
                }))
            : [],
        }))
        .sort(sortByStartDesc)
    : [];
}
