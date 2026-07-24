import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient, getUser } from '@/lib/supabase/server';
import { buildCoverLetterSystemPrompt, buildCoverLetterUserMessage } from '@/lib/server/coverLetter';

export const runtime = 'nodejs';
export const maxDuration = 60;

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
  if (!applicationId || !jdText) {
    return NextResponse.json(
      { error: 'application_id and jd_text are required.' },
      { status: 400 }
    );
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

  const systemPrompt = buildCoverLetterSystemPrompt({
    company: application.company,
    roleTitle: application.role_title,
  });
  const userMessage = buildCoverLetterUserMessage({
    profile,
    experiences,
    jdText,
    company: application.company,
    roleTitle: application.role_title,
  });

  let coverLetter;
  try {
    const anthropic = new Anthropic();
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });
    const block = response.content.find((b) => b.type === 'text');
    coverLetter = (block ? block.text : '').trim();
  } catch (err) {
    return NextResponse.json(
      { error: err.message || 'The Anthropic API request failed.' },
      { status: 502 }
    );
  }

  if (!coverLetter) {
    return NextResponse.json(
      { error: 'The model returned an empty response.' },
      { status: 502 }
    );
  }

  const { error: insertError } = await supabase.from('tailoring_runs').insert({
    application_id: applicationId,
    jd_keywords: null,
    match_score: null,
    suggestions: { type: 'cover_letter', company: application.company, role_title: application.role_title },
    generated_text: coverLetter,
  });
  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ result: { cover_letter: coverLetter } });
}
