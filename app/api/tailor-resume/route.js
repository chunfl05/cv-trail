import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient, getUser } from '@/lib/supabase/server';
import { stripJsonFence } from '@/lib/server/jsonFence';
import { extractResumeText } from '@/lib/server/resumeText';
import { buildLatexResume } from '@/lib/server/resumeLatex';
import { resumeJsonToPlainText } from '@/lib/server/resumeTemplate';
import {
  BANK_SYSTEM_PROMPT,
  UPLOAD_SYSTEM_PROMPT,
  partitionExperiences,
  buildBankUserMessage,
  resolveSkills,
  reconcileBankResponse,
  toHtmlResumeJson,
  normalizeUploadEntries,
} from '@/lib/server/resumeBank';

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

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const applicationId = formData.get('application_id');
  const jdText = (formData.get('jd_text') || '').toString().trim();
  const file = formData.get('resume');
  const uploadMode = file && typeof file !== 'string';

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

  let name = '';
  let contactParts = [];
  let education = [];
  let experience = [];
  let projects = [];
  let skillsByCategory = {};
  let skillsOrder;
  let matchScore = null;

  if (uploadMode) {
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
        system: UPLOAD_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `USER'S REAL RESUME:\n${resumeText}\n\nJOB DESCRIPTION:\n${jdText}`,
          },
        ],
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

    matchScore = Number.isInteger(parsed.match_score) ? parsed.match_score : null;
    name = parsed.name || '';
    contactParts = [parsed.phone, parsed.email].filter(Boolean);
    education = normalizeUploadEntries(parsed.education);
    experience = normalizeUploadEntries(parsed.experience);
    projects = normalizeUploadEntries(parsed.projects);
    if (parsed.skills && typeof parsed.skills === 'object') {
      for (const [cat, values] of Object.entries(parsed.skills)) {
        if (Array.isArray(values) && values.length) skillsByCategory[cat] = values;
      }
    }
  } else {
    const [{ data: profile }, { data: experiences, error: expError }] = await Promise.all([
      supabase.from('profile').select('*').maybeSingle(),
      supabase.from('experiences').select('*'),
    ]);
    if (expError) {
      return NextResponse.json({ error: expError.message }, { status: 500 });
    }
    if (!experiences || experiences.length === 0) {
      return NextResponse.json(
        {
          error:
            'Your Experience Bank is empty — add experiences first, or upload a resume file instead.',
        },
        { status: 422 }
      );
    }

    const { mustInclude, candidates } = partitionExperiences(experiences);
    const { skillsByCategory: resolvedSkills } = resolveSkills(profile);
    const skillCategoryNames = Object.keys(resolvedSkills);

    let rawText;
    try {
      const anthropic = new Anthropic();
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-5',
        max_tokens: 8000,
        system: BANK_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: buildBankUserMessage({
              mustInclude,
              candidates,
              skillCategories: skillCategoryNames,
              jdText,
            }),
          },
        ],
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

    matchScore = Number.isInteger(parsed.match_score) ? parsed.match_score : null;

    ({ education, experience, projects, skillsByCategory, skillsOrder } = reconcileBankResponse({
      experiences,
      mustInclude,
      parsed,
      profile,
    }));

    name = profile?.full_name || '';
    contactParts = [profile?.phone, profile?.email].filter(Boolean);
  }

  const latex = buildLatexResume({
    name,
    contactParts,
    education,
    experience,
    projects,
    skillsByCategory,
    skillsOrder,
  });

  const resumeJson = toHtmlResumeJson({
    name,
    contact: contactParts.join(' · '),
    education,
    experience,
    projects,
    skillsByCategory,
    skillsOrder,
  });

  const label = `${application.role_title} @ ${application.company} (tailored)`;
  const { data: resumeRow, error: resumeInsertError } = await supabase
    .from('resumes')
    .insert({
      label,
      is_base: false,
      file_url: null,
      content: { resume_json: resumeJson, latex },
    })
    .select('id')
    .single();
  if (resumeInsertError) {
    return NextResponse.json({ error: resumeInsertError.message }, { status: 500 });
  }

  const plainText = resumeJsonToPlainText(resumeJson);

  const { error: insertError } = await supabase.from('tailoring_runs').insert({
    application_id: applicationId,
    jd_keywords: [],
    match_score: matchScore,
    suggestions: { resume_json: resumeJson, latex, resume_id: resumeRow.id },
    generated_text: latex,
  });
  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const { error: updateError } = await supabase
    .from('applications')
    .update({ match_score: matchScore, jd_text: jdText })
    .eq('id', applicationId);
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    result: {
      match_score: matchScore,
      latex,
      resume: resumeJson,
      plain_text: plainText,
      resume_id: resumeRow.id,
    },
  });
}
