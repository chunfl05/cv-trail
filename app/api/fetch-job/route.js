import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getUser } from '@/lib/supabase/server';
import { stripJsonFence } from '@/lib/server/jsonFence';
import { htmlToText } from '@/lib/server/htmlToText';

export const maxDuration = 30;

const UNREACHABLE_MESSAGE = '该网站可能无法抓取,请手动粘贴 JD。';

const BROWSER_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const SYSTEM_PROMPT = `You extract structured job-posting fields from the raw text of a web page.

CRITICAL RULES:
- Only use information present in the page text. NEVER invent or guess a company name, role, location, salary, or job description content that isn't there.
- If a field cannot be determined from the text, return an empty string for it — do not omit the field and do not guess.

Output ONLY a single valid JSON object, with no preamble, no explanation, and no markdown code fences. The JSON must match exactly this shape:

{
  "company": "<company name, or empty string>",
  "role_title": "<job title, or empty string>",
  "jd_text": "<the full job description text, cleaned up for readability, or empty string>",
  "location": "<job location, or empty string>",
  "salary_range": "<salary/compensation range as stated, or empty string>"
}

Return nothing but the JSON object.`;

export async function POST(request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const url = (body.url || '').trim();
  if (!url) {
    return NextResponse.json({ error: 'A URL is required.' }, { status: 400 });
  }

  let html;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    let res;
    try {
      res = await fetch(url, {
        headers: { 'User-Agent': BROWSER_USER_AGENT },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
    html = await res.text();
  } catch {
    return NextResponse.json({ error: UNREACHABLE_MESSAGE }, { status: 502 });
  }

  const pageText = htmlToText(html).slice(0, 15000);
  if (!pageText || pageText.length < 50) {
    return NextResponse.json({ error: UNREACHABLE_MESSAGE }, { status: 422 });
  }

  let rawText;
  try {
    const anthropic = new Anthropic();
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 3000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `PAGE TEXT:\n${pageText}` }],
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
  } catch {
    return NextResponse.json({ error: UNREACHABLE_MESSAGE }, { status: 502 });
  }

  return NextResponse.json({ result: parsed });
}
