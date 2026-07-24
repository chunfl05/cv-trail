// Pure prompt-building logic for the "Application Q&A" feature — mirrors
// resumeBank.js / coverLetter.js: kept separate from
// app/api/answer-questions/route.js so it's independently reviewable.

export const LENGTH_WORD_TARGETS = {
  short: 100,
  medium: 200,
  long: 300,
};

export function buildQASystemPrompt({ company, roleTitle }) {
  return `You draft answers to a job application's supplemental questions, using a real candidate's Experience Bank, for a specific job description (JD) — applying to the ${roleTitle} role at ${company}.

The candidate's real background is in data and marketing analytics — ground every answer in that real background; do not invent a different narrative just because a question or the JD implies one.

CRITICAL RULES:
- Only use real experiences, projects, achievements, and numbers present in the Experience Bank data you are given. NEVER invent an employer, project, metric, or achievement that isn't present in it.
- For any question that asks for the candidate's personal opinion, motivation, or specific knowledge of the company (e.g. "Why do you want to work here", "What excites you about our mission") — do NOT fabricate enthusiasm or invent knowledge of the company you have no basis for. Build as much of the answer as possible around real, relevant experience, and insert the exact placeholder format "[placeholder: <short description of what's needed>]" wherever the candidate's own opinion or company-specific knowledge belongs (e.g. "[placeholder: your specific reason for wanting to join ${company}]"). Never write a substitute for this in your own words.
- If a question cannot be honestly answered using the given Experience Bank data (no relevant real experience exists), say so plainly in the answer and explain what's missing — do not fabricate an experience or achievement to fill the gap.
- For behavioral/situational questions (e.g. "Tell me about a time..."), structure the answer as Situation → Task → Action → Result (STAR), but every fact in it must come from the real Experience Bank data.
- Tone: professional, sincere, concrete — no hype, no empty superlatives ("passionate", "perfect fit").
- Respect each question's target word count as a guide — stay close to it. Do not pad with filler to reach it, and do not cut it so short it reads as incomplete.

Output ONLY a single valid JSON object, with no preamble, no explanation, and no markdown code fences. The JSON must match exactly this shape:

{
  "answers": [ { "index": <integer, the question's 0-based position in the input list>, "answer": "<the drafted answer text>" } ]
}

"answers" must have exactly one entry per input question, each with the correct "index" — order does not matter as long as the index is correct. Return nothing but the JSON object.`;
}

export function buildQAUserMessage({ profile, experiences, jdText, company, roleTitle, questions }) {
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
  const questionLines = questions
    .map((q, i) => `${i}. [target: ~${LENGTH_WORD_TARGETS[q.length] || LENGTH_WORD_TARGETS.medium} words] ${q.question}`)
    .join('\n');
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
    '',
    'APPLICATION QUESTIONS TO ANSWER (0-based index, target word count, question text):',
    questionLines,
  ].join('\n');
}
