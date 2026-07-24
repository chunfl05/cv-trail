import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getUser } from '@/lib/supabase/server';
import { stripJsonFence } from '@/lib/server/jsonFence';
import { extractResumeText } from '@/lib/server/resumeText';

export const runtime = 'nodejs';
export const maxDuration = 60;

const SYSTEM_PROMPT = `You extract structured work/education/project history from a resume's real text so it can be imported into an experience tracker.

CRITICAL RULES:
- Only use content present in the resume text. NEVER invent employers, titles, dates, metrics, or bullets that are not there.
- Split the resume into one entry per distinct experience (job, internship, project, or education entry).
- Rephrase bullets minimally — keep them close to the original wording, just cleaned up.
- If a field cannot be determined, use an empty string (or empty array for list fields) — never guess.
- Dates: resumes typically only state a month and year (e.g. "Sep 2023"), never a specific day. Always output dates as "YYYY-MM-01" — always include the full 4-digit year, and always use "01" for the day since the source never has one. Never output a bare "YYYY-MM" or a date missing its year.

Output ONLY a single valid JSON array, with no preamble, no explanation, and no markdown code fences. Each array item must match exactly this shape:

{
  "org": "<organization or school name>",
  "role": "<role or degree title>",
  "type": "<one of: internship, job, project, education>",
  "start_date": "<YYYY-MM-01 if determinable, else empty string>",
  "end_date": "<YYYY-MM-01 if determinable and the entry has ended, else empty string>",
  "location": "<string, or empty string>",
  "summary": "<a one or two sentence scope/context summary, or empty string>",
  "tech_stack": [<strings — technologies/tools mentioned for this entry>],
  "bullets": [<strings — the real achievement/responsibility bullets for this entry>]
}

If there is nothing to extract, return an empty array. Return nothing but the JSON array.`;

export async function POST(request) {
  try {
    return await handlePost(request);
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || 'Unexpected server error.' },
      { status: 500 }
    );
  }
}

async function handlePost(request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const file = formData.get('resume');
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'A resume file is required.' }, { status: 400 });
  }

  let resumeText;
  try {
    resumeText = await extractResumeText(file);
  } catch (err) {
    return NextResponse.json(
      { error: err.message || 'Could not read that resume file.' },
      { status: 422 }
    );
  }
  if (!resumeText || !resumeText.trim()) {
    return NextResponse.json(
      { error: 'Could not extract any text from that file.' },
      { status: 422 }
    );
  }

  let rawText;
  try {
    const anthropic = new Anthropic();
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 8000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `RESUME TEXT:\n${resumeText}` }],
    });
    const block = response.content.find((b) => b.type === 'text');
    rawText = block ? block.text : '';
  } catch (err) {
    return NextResponse.json(
      { error: err.message || 'The Anthropic API request failed.' },
      { status: 502 }
    );
  }

  let parsed;
  try {
    parsed = JSON.parse(stripJsonFence(rawText));
    if (!Array.isArray(parsed)) throw new Error('Model did not return a JSON array.');
  } catch {
    return NextResponse.json(
      { error: 'Could not parse the model response as JSON.' },
      { status: 502 }
    );
  }

  return NextResponse.json({ result: parsed });
}
