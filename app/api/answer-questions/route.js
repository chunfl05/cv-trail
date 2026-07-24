import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient, getUser } from '@/lib/supabase/server';
import { stripJsonFence } from '@/lib/server/jsonFence';
import { buildQASystemPrompt, buildQAUserMessage } from '@/lib/server/qa';

export const runtime = 'nodejs';
export const maxDuration = 60;

const VALID_LENGTHS = ['short', 'medium', 'long'];

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

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const applicationId = body.application_id;
  const jdText = (body.jd_text || '').toString().trim();
  const rawQuestions = Array.isArray(body.questions) ? body.questions : [];
  const questions = rawQuestions
    .map((q) => ({
      question: (q?.question || '').toString().trim(),
      length: VALID_LENGTHS.includes(q?.length) ? q.length : 'medium',
    }))
    .filter((q) => q.question);

  if (!applicationId || !jdText) {
    return NextResponse.json(
      { error: 'application_id and jd_text are required.' },
      { status: 400 }
    );
  }
  if (questions.length === 0) {
    return NextResponse.json({ error: 'At least one question is required.' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: application, error: appError } = await supabase
    .from('applications')
    .select('id, company, role_title')
    .eq('id', applicationId)
    .maybeSingle();
  if (appError) {
    return NextResponse.json({ error: appError.message }, { status: 500 });
  }
  if (!application) {
    return NextResponse.json({ error: 'Application not found.' }, { status: 404 });
  }

  const [{ data: profile }, { data: experiences, error: expError }] = await Promise.all([
    supabase.from('profile').select('*').maybeSingle(),
    supabase.from('experiences').select('*'),
  ]);
  if (expError) {
    return NextResponse.json({ error: expError.message }, { status: 500 });
  }
  if (!experiences || experiences.length === 0) {
    return NextResponse.json(
      { error: 'Your Experience Bank is empty — add experiences first.' },
      { status: 422 }
    );
  }

  const systemPrompt = buildQASystemPrompt({
    company: application.company,
    roleTitle: application.role_title,
  });
  const userMessage = buildQAUserMessage({
    profile,
    experiences,
    jdText,
    company: application.company,
    roleTitle: application.role_title,
    questions,
  });

  let rawText;
  try {
    const anthropic = new Anthropic();
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 6000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
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
    return NextResponse.json(
      { error: 'Could not parse the model response as JSON.' },
      { status: 502 }
    );
  }

  const answersByIndex = new Map();
  if (Array.isArray(parsed.answers)) {
    for (const a of parsed.answers) {
      if (a && Number.isInteger(a.index) && typeof a.answer === 'string') {
        answersByIndex.set(a.index, a.answer);
      }
    }
  }

  const results = questions.map((q, i) => ({
    question: q.question,
    length: q.length,
    answer: answersByIndex.get(i) || '',
  }));

  const plainText = results.map((r) => `Q: ${r.question}\nA: ${r.answer}`).join('\n\n');

  const { error: insertError } = await supabase.from('tailoring_runs').insert({
    application_id: applicationId,
    jd_keywords: null,
    match_score: null,
    suggestions: { type: 'qa', answers: results },
    generated_text: plainText,
  });
  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ result: { answers: results } });
}
