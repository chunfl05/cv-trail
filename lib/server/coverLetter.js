// Pure prompt-building logic for cover letter generation — kept separate
// from app/api/cover-letter/route.js for the same reason as resumeBank.js:
// independently reviewable without a live request.

export function buildCoverLetterSystemPrompt({ company, roleTitle }) {
  const placeholder = `[describe what draws you to ${company}]`;
  return `You write a cover letter using a real candidate's Experience Bank entries, tailored to a specific job description (JD).

The candidate's real background is in data and marketing analytics — do not invent a different narrative (e.g. do not position them as a software engineer, or in any field unrelated to their real experience, just because the JD calls for it).

CRITICAL RULES:
- Only use real experiences, skills, achievements, and numbers from the Experience Bank data you are given. NEVER invent an employer, title, project, metric, or achievement that isn't present in it.
- NEVER fabricate the candidate's personal enthusiasm for or knowledge of the company (e.g. "I have long admired your work in X" or "I'm drawn to your mission of Y") — you have no real basis for that. Anywhere the letter would naturally need the candidate's own opinion, or specific knowledge of the company's products, culture, or mission, insert the exact placeholder text "${placeholder}" instead of writing it yourself. Do not paraphrase or invent a substitute for this placeholder.
- Use the real company name "${company}" and role title "${roleTitle}" exactly as given — do not alter them.
- Tone: professional, restrained, concrete. No hype, no superlatives, no empty enthusiasm ("passionate", "thrilled", "perfect fit"). Let the real experience and JD alignment do the work.

STRUCTURE (plain prose paragraphs — no headers, no bullet points, no markdown, no letterhead/date/address block, no salutation like "Dear Hiring Manager", no sign-off — just the body paragraphs):
1. Opening: state interest in the ${roleTitle} role at ${company}.
2. Body (1-2 paragraphs): connect real Experience Bank background to what the JD asks for — concrete and specific, drawn only from the given data.
3. Why a fit: briefly explain why the candidate's background fits this specific role, still grounded only in real data.
4. Closing: brief, professional close.

Output ONLY the plain-text body of the cover letter — no preamble, no explanation, no markdown formatting, no JSON.`;
}

export function buildCoverLetterUserMessage({ profile, experiences, jdText, company, roleTitle }) {
  const summarized = experiences.map((e) => ({
    org: e.org,
    role: e.role,
    type: e.type,
    start_date: e.start_date,
    end_date: e.end_date,
    tech_stack: e.tech_stack || [],
    tags: e.tags || [],
    bullets: (e.bullets || []).map((b) => b.text).filter(Boolean),
  }));
  return [
    `CANDIDATE NAME: ${profile?.full_name || ''}`,
    `COMPANY: ${company}`,
    `ROLE: ${roleTitle}`,
    '',
    "CANDIDATE'S REAL EXPERIENCE BANK (the only source of experience/skills/achievements — do not use anything not present here):",
    JSON.stringify(summarized, null, 2),
    '',
    'JOB DESCRIPTION:',
    jdText,
  ].join('\n');
}
