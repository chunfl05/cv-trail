'use client';

import { useState } from 'react';
import Modal from './Modal';
import ResumePreview from '@/components/ResumePreview';

// Shows the content saved for an AI-generated Resume Vault entry: the
// front-end resume preview plus a Copy LaTeX button. Replaces the old
// PDF download/open flow now that generation no longer produces a file.
export default function ResumeViewModal({ open, resume, onClose }) {
  const [copied, setCopied] = useState(false);
  if (!resume) return null;

  const resumeJson = resume.content?.resume_json;
  const latex = resume.content?.latex || '';

  const copyLatex = async () => {
    try {
      await navigator.clipboard.writeText(latex);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert('Could not copy — select the text manually.');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={resume.label || 'Generated resume'}
      footer={
        <>
          <button className="btn ghost" onClick={onClose}>Close</button>
          <button className="btn" onClick={copyLatex} disabled={!latex}>
            {copied ? 'Copied!' : 'Copy LaTeX'}
          </button>
        </>
      }
    >
      {latex && (
        <pre
          style={{
            margin: '0 0 16px',
            padding: 14,
            background: 'var(--paper-2)',
            border: '1px solid var(--line-soft)',
            borderRadius: 8,
            fontSize: 11.5,
            lineHeight: 1.55,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            maxHeight: 240,
            overflowY: 'auto',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {latex}
        </pre>
      )}
      <div
        style={{
          border: '1px solid var(--line-soft)',
          borderRadius: 8,
          padding: 16,
        }}
      >
        <div className="card-sub" style={{ marginBottom: 8 }}>Preview</div>
        <ResumePreview resume={resumeJson} />
      </div>
    </Modal>
  );
}
