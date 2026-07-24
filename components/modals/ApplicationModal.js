'use client';

import { useEffect, useState } from 'react';
import Modal from './Modal';
import ResumePreview from '@/components/ResumePreview';
import Icon from '@/components/Icon';
import { useApplications } from '@/lib/applications';
import { createClient } from '@/lib/supabase/client';
import { isoDate } from '@/lib/helpers';

const EMPTY_QUESTION = { question: '', length: 'medium' };

const EMPTY = {
  company: '',
  role_title: '',
  source: 'LinkedIn',
  status: 'applied',
  applied_date: isoDate(),
  location: '',
  salary_range: '',
  jd_text: '',
  jd_url: '',
  notes: '',
};

export default function ApplicationModal({ open, editing, onClose }) {
  const { addApplication, updateApplication, refresh } = useApplications();
  const [supabase] = useState(() => createClient());
  const [form, setForm] = useState(EMPTY);
  const [fetchingJob, setFetchingJob] = useState(false);
  const [fetchJobError, setFetchJobError] = useState(null);
  const [fetchJobNote, setFetchJobNote] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);
  const [tailoringResume, setTailoringResume] = useState(false);
  const [resumeTailorResult, setResumeTailorResult] = useState(null);
  const [resumeTailorError, setResumeTailorError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [generatingCoverLetter, setGeneratingCoverLetter] = useState(false);
  const [coverLetterResult, setCoverLetterResult] = useState(null);
  const [coverLetterError, setCoverLetterError] = useState(null);
  const [coverLetterCopied, setCoverLetterCopied] = useState(false);
  const [qaQuestions, setQaQuestions] = useState([EMPTY_QUESTION]);
  const [answeringQuestions, setAnsweringQuestions] = useState(false);
  const [qaResult, setQaResult] = useState(null);
  const [qaError, setQaError] = useState(null);
  const [qaCopiedIndex, setQaCopiedIndex] = useState(null);

  // Loads the most recently generated resume, cover letter, and Q&A answers
  // for this application, so reopening the modal shows what was last
  // generated without spending tokens on a fresh AI call.
  const loadLatestTailoring = async (applicationId) => {
    const { data } = await supabase
      .from('tailoring_runs')
      .select('*')
      .eq('application_id', applicationId)
      .order('created_at', { ascending: false });
    if (!data) return;

    const resumeRun = data.find((r) => r.suggestions?.resume_json !== undefined);
    if (resumeRun) {
      setResumeTailorResult({
        match_score: resumeRun.match_score,
        resume: resumeRun.suggestions.resume_json,
        latex: resumeRun.suggestions.latex || resumeRun.generated_text || '',
      });
    }

    const coverLetterRun = data.find((r) => r.suggestions?.type === 'cover_letter');
    if (coverLetterRun) {
      setCoverLetterResult({ cover_letter: coverLetterRun.generated_text || '' });
    }

    const qaRun = data.find((r) => r.suggestions?.type === 'qa');
    if (qaRun && Array.isArray(qaRun.suggestions.answers)) {
      setQaResult(qaRun.suggestions.answers);
      setQaQuestions(qaRun.suggestions.answers.map((a) => ({ question: a.question, length: a.length || 'medium' })));
    }
  };

  useEffect(() => {
    if (!open) return;
    setFetchJobError(null);
    setFetchJobNote(null);
    setResumeFile(null);
    setResumeTailorResult(null);
    setResumeTailorError(null);
    setCopied(false);
    setCoverLetterResult(null);
    setCoverLetterError(null);
    setCoverLetterCopied(false);
    setQaQuestions([EMPTY_QUESTION]);
    setQaResult(null);
    setQaError(null);
    setQaCopiedIndex(null);
    if (editing) {
      setForm({
        company: editing.company || '',
        role_title: editing.role_title || '',
        source: editing.source || 'LinkedIn',
        status: editing.status || 'applied',
        applied_date: editing.applied_date || isoDate(),
        location: editing.location || '',
        salary_range: editing.salary_range || '',
        jd_text: editing.jd_text || '',
        jd_url: editing.jd_url || '',
        notes: editing.notes || '',
      });
      loadLatestTailoring(editing.id);
    } else {
      setForm({ ...EMPTY, applied_date: isoDate() });
    }
  }, [open, editing]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async () => {
    if (!form.company.trim() || !form.role_title.trim()) {
      alert('Company and role are required.');
      return;
    }
    const payload = {
      company: form.company.trim(),
      role_title: form.role_title.trim(),
      source: form.source,
      status: form.status,
      applied_date: form.applied_date || null,
      location: form.location.trim() || null,
      salary_range: form.salary_range.trim() || null,
      jd_text: form.jd_text.trim() || null,
      jd_url: form.jd_url.trim() || null,
      notes: form.notes.trim() || null,
    };
    try {
      if (editing) {
        await updateApplication(editing.id, payload);
      } else {
        await addApplication(payload);
      }
      onClose();
    } catch (e) {
      alert(e.message || 'Failed to save application.');
    }
  };

  const runFetchJob = async () => {
    if (!form.jd_url.trim()) {
      alert('Paste the job posting URL first.');
      return;
    }
    setFetchingJob(true);
    setFetchJobError(null);
    setFetchJobNote(null);
    try {
      const res = await fetch('/api/fetch-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: form.jd_url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not fetch that page.');
      const r = data.result || {};
      setForm((f) => ({
        ...f,
        company: r.company || f.company,
        role_title: r.role_title || f.role_title,
        jd_text: r.jd_text || f.jd_text,
        location: r.location || f.location,
        salary_range: r.salary_range || f.salary_range,
      }));
      setFetchJobNote('Fetched — review the fields below, then click Save to keep them.');
    } catch (e) {
      setFetchJobError(e.message || '该网站可能无法抓取,请手动粘贴 JD。');
    } finally {
      setFetchingJob(false);
    }
  };

  const runTailorResume = async () => {
    if (!form.jd_text.trim()) {
      alert('Paste the job description first.');
      return;
    }
    setTailoringResume(true);
    setResumeTailorError(null);
    setResumeTailorResult(null);
    setCopied(false);
    try {
      const body = new FormData();
      body.set('application_id', editing.id);
      body.set('jd_text', form.jd_text);
      if (resumeFile) body.set('resume', resumeFile);
      const res = await fetch('/api/tailor-resume', { method: 'POST', body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Tailoring failed.');
      setResumeTailorResult(data.result);
      await refresh();
    } catch (e) {
      setResumeTailorError(e.message || 'Tailoring failed.');
    } finally {
      setTailoringResume(false);
    }
  };

  const copyLatex = async () => {
    if (!resumeTailorResult?.latex) return;
    try {
      await navigator.clipboard.writeText(resumeTailorResult.latex);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert('Could not copy — select the text manually.');
    }
  };

  const runCoverLetter = async () => {
    if (!form.jd_text.trim()) {
      alert('Paste the job description first.');
      return;
    }
    setGeneratingCoverLetter(true);
    setCoverLetterError(null);
    setCoverLetterResult(null);
    setCoverLetterCopied(false);
    try {
      const res = await fetch('/api/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ application_id: editing.id, jd_text: form.jd_text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Cover letter generation failed.');
      setCoverLetterResult(data.result);
    } catch (e) {
      setCoverLetterError(e.message || 'Cover letter generation failed.');
    } finally {
      setGeneratingCoverLetter(false);
    }
  };

  const copyCoverLetter = async () => {
    if (!coverLetterResult?.cover_letter) return;
    try {
      await navigator.clipboard.writeText(coverLetterResult.cover_letter);
      setCoverLetterCopied(true);
      setTimeout(() => setCoverLetterCopied(false), 2000);
    } catch {
      alert('Could not copy — select the text manually.');
    }
  };

  const updateQuestionRow = (i, patch) => {
    setQaQuestions((rows) => rows.map((r, ri) => (ri === i ? { ...r, ...patch } : r)));
  };

  const addQuestionRow = () => setQaQuestions((rows) => [...rows, EMPTY_QUESTION]);

  const removeQuestionRow = (i) => {
    setQaQuestions((rows) => (rows.length > 1 ? rows.filter((_, ri) => ri !== i) : rows));
  };

  const runAnswerQuestions = async () => {
    if (!form.jd_text.trim()) {
      alert('Paste the job description first.');
      return;
    }
    const questions = qaQuestions.filter((q) => q.question.trim());
    if (questions.length === 0) {
      alert('Paste at least one application question first.');
      return;
    }
    setAnsweringQuestions(true);
    setQaError(null);
    setQaResult(null);
    setQaCopiedIndex(null);
    try {
      const res = await fetch('/api/answer-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ application_id: editing.id, jd_text: form.jd_text, questions }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Drafting answers failed.');
      setQaResult(data.result.answers);
    } catch (e) {
      setQaError(e.message || 'Drafting answers failed.');
    } finally {
      setAnsweringQuestions(false);
    }
  };

  const copyAnswer = async (i, text) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setQaCopiedIndex(i);
      setTimeout(() => setQaCopiedIndex(null), 2000);
    } catch {
      alert('Could not copy — select the text manually.');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Edit application' : 'New application'}
      footer={
        <>
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn" onClick={save}>Save</button>
        </>
      }
    >
      <div className="form-grid">
        <div className="full">
          <label>Company</label>
          <input type="text" value={form.company} onChange={set('company')} placeholder="e.g. Acme Inc." />
        </div>
        <div className="full">
          <label>Role</label>
          <input type="text" value={form.role_title} onChange={set('role_title')} placeholder="e.g. Senior Product Manager" />
        </div>
        <div>
          <label>Source</label>
          <select value={form.source} onChange={set('source')}>
            <option>LinkedIn</option>
            <option>Referral</option>
            <option>Company site</option>
            <option>Indeed</option>
            <option>Other</option>
          </select>
        </div>
        <div>
          <label>Status</label>
          <select value={form.status} onChange={set('status')}>
            <option value="applied">Applied</option>
            <option value="screening">Screening</option>
            <option value="interview">Interview</option>
            <option value="offer">Offer</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        <div>
          <label>Applied on</label>
          <input type="date" value={form.applied_date} onChange={set('applied_date')} />
        </div>
        <div>
          <label>Location</label>
          <input type="text" value={form.location} onChange={set('location')} placeholder="e.g. Remote" />
        </div>
        <div>
          <label>Salary range</label>
          <input type="text" value={form.salary_range} onChange={set('salary_range')} placeholder="e.g. $120k–$150k" />
        </div>
        <div className="full">
          <label>JD link</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="url"
              value={form.jd_url}
              onChange={set('jd_url')}
              placeholder="Link to the posting"
              style={{ flex: 1 }}
            />
            <button
              type="button"
              className="btn ghost sm"
              onClick={runFetchJob}
              disabled={fetchingJob}
              style={{ whiteSpace: 'nowrap' }}
            >
              {fetchingJob ? 'Fetching…' : 'Fetch from URL'}
            </button>
          </div>
          {fetchJobNote && (
            <p className="auth-message ok" style={{ marginTop: 8 }}>{fetchJobNote}</p>
          )}
          {fetchJobError && (
            <p className="auth-message error" style={{ marginTop: 8 }}>{fetchJobError}</p>
          )}
        </div>
        <div className="full">
          <label>Job description</label>
          <textarea
            value={form.jd_text}
            onChange={set('jd_text')}
            placeholder="Paste the full JD text here, or fetch it from the URL above."
            style={{ minHeight: 140 }}
          />
        </div>
        <div className="full">
          <label>Notes</label>
          <textarea
            value={form.notes}
            onChange={set('notes')}
            placeholder="Recruiter name, anything worth remembering..."
          />
        </div>

        {editing && (
          <div className="full">
            <div className="auth-divider" style={{ margin: '4px 0 12px' }}>Tailor my resume</div>
            <p className="page-sub" style={{ marginBottom: 10 }}>
              Builds a tailored resume from your Experience Bank and this JD, previewed right here and saved to the Resume Vault.
            </p>
            <button
              type="button"
              className="btn"
              onClick={runTailorResume}
              disabled={tailoringResume}
            >
              {tailoringResume ? 'Tailoring…' : 'Generate tailored resume'}
            </button>

            <details style={{ marginTop: 12 }}>
              <summary style={{ cursor: 'pointer', fontSize: 12.5, color: 'var(--ink-3)' }}>
                Or upload a resume file instead
              </summary>
              <div style={{ marginTop: 10 }}>
                <input
                  type="file"
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                />
                {resumeFile && (
                  <p className="page-sub" style={{ marginTop: 8 }}>
                    Will use "{resumeFile.name}" instead of the Experience Bank next time you click Generate.
                  </p>
                )}
              </div>
            </details>

            {resumeTailorError && (
              <p className="auth-message error" style={{ margin: '14px 0' }}>{resumeTailorError}</p>
            )}

            {resumeTailorResult && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontFamily: "'Source Serif 4', serif",
                      fontSize: 28,
                      fontWeight: 600,
                      color: 'var(--ink)',
                    }}
                  >
                    {resumeTailorResult.match_score}%
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>match score</span>
                  <button
                    type="button"
                    className="btn sm"
                    onClick={copyLatex}
                    style={{ marginLeft: 'auto' }}
                  >
                    {copied ? 'Copied!' : 'Copy LaTeX'}
                  </button>
                </div>

                <p className="page-sub" style={{ margin: 0 }}>
                  Paste the LaTeX below into your resume's .tex file, or check the preview beneath it. This version is also saved to the Resume Vault.
                </p>

                <pre
                  style={{
                    margin: 0,
                    padding: 14,
                    background: 'var(--paper-2)',
                    border: '1px solid var(--line-soft)',
                    borderRadius: 8,
                    fontSize: 11.5,
                    lineHeight: 1.55,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    maxHeight: 280,
                    overflowY: 'auto',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {resumeTailorResult.latex}
                </pre>

                <div
                  style={{
                    border: '1px solid var(--line-soft)',
                    borderRadius: 8,
                    padding: 16,
                    maxHeight: 340,
                    overflowY: 'auto',
                  }}
                >
                  <div className="card-sub" style={{ marginBottom: 8 }}>Preview</div>
                  <ResumePreview resume={resumeTailorResult.resume} />
                </div>
              </div>
            )}

            <div className="auth-divider" style={{ margin: '24px 0 12px' }}>Cover letter</div>
            <p className="page-sub" style={{ marginBottom: 10 }}>
              Drafts a cover letter from your Experience Bank and this JD. Anything requiring your personal opinion (e.g. why this company) is left as a placeholder for you to fill in.
            </p>
            <button
              type="button"
              className="btn"
              onClick={runCoverLetter}
              disabled={generatingCoverLetter}
            >
              {generatingCoverLetter ? 'Generating…' : 'Generate cover letter'}
            </button>

            {coverLetterError && (
              <p className="auth-message error" style={{ margin: '14px 0' }}>{coverLetterError}</p>
            )}

            {coverLetterResult && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="button" className="btn sm" onClick={copyCoverLetter}>
                    {coverLetterCopied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <pre
                  style={{
                    margin: 0,
                    padding: 14,
                    background: 'var(--paper-2)',
                    border: '1px solid var(--line-soft)',
                    borderRadius: 8,
                    fontSize: 13,
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    maxHeight: 340,
                    overflowY: 'auto',
                    fontFamily: 'inherit',
                  }}
                >
                  {coverLetterResult.cover_letter}
                </pre>
              </div>
            )}

            <div className="auth-divider" style={{ margin: '24px 0 12px' }}>Application Q&A</div>
            <p className="page-sub" style={{ marginBottom: 10 }}>
              Paste the supplemental questions this application actually asks, pick a target length for each, and draft answers from your Experience Bank.
            </p>

            {qaQuestions.map((q, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 10 }}>
                <textarea
                  value={q.question}
                  onChange={(e) => updateQuestionRow(i, { question: e.target.value })}
                  placeholder={`Question ${i + 1}`}
                  style={{ flex: 1, minHeight: 60 }}
                />
                <select
                  value={q.length}
                  onChange={(e) => updateQuestionRow(i, { length: e.target.value })}
                  style={{ width: 140, flexShrink: 0 }}
                >
                  <option value="short">Short (~100w)</option>
                  <option value="medium">Medium (~200w)</option>
                  <option value="long">Long (~300w)</option>
                </select>
                {qaQuestions.length > 1 && (
                  <button
                    type="button"
                    className="icon-btn"
                    title="Remove question"
                    onClick={() => removeQuestionRow(i)}
                    style={{ flexShrink: 0 }}
                  >
                    <Icon name="trash" size={14} strokeWidth={1.5} />
                  </button>
                )}
              </div>
            ))}

            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <button type="button" className="btn ghost sm" onClick={addQuestionRow}>
                + Add question
              </button>
              <button
                type="button"
                className="btn"
                onClick={runAnswerQuestions}
                disabled={answeringQuestions}
                style={{ marginLeft: 'auto' }}
              >
                {answeringQuestions ? 'Drafting…' : 'Draft answers'}
              </button>
            </div>

            {qaError && (
              <p className="auth-message error" style={{ margin: '14px 0' }}>{qaError}</p>
            )}

            {qaResult && qaResult.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 8 }}>
                {qaResult.map((r, i) => (
                  <div
                    key={i}
                    style={{ border: '1px solid var(--line-soft)', borderRadius: 8, padding: 14 }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 8,
                        marginBottom: 8,
                        alignItems: 'flex-start',
                      }}
                    >
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{r.question}</div>
                      <button
                        type="button"
                        className="btn sm"
                        onClick={() => copyAnswer(i, r.answer)}
                        style={{ flexShrink: 0 }}
                      >
                        {qaCopiedIndex === i ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                      {r.answer}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
