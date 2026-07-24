'use client';

import { useState } from 'react';
import Modal from './Modal';
import { makeId } from '@/lib/helpers';

const TYPES = [
  { value: 'internship', label: 'Internship' },
  { value: 'job', label: 'Job' },
  { value: 'project', label: 'Project' },
  { value: 'education', label: 'Education' },
];

function toCsv(arr) {
  return (arr || []).join(', ');
}

function fromCsv(str) {
  return (str || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function toLines(arr) {
  return (arr || []).join('\n');
}

function fromLines(str) {
  return (str || '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
}

function toEditable(item) {
  return {
    _key: makeId(),
    org: item.org || '',
    role: item.role || '',
    type: ['internship', 'job', 'project', 'education'].includes(item.type) ? item.type : 'job',
    start_date: item.start_date || '',
    end_date: item.end_date || '',
    location: item.location || '',
    summary: item.summary || '',
    tech_stack: toCsv(item.tech_stack),
    bullets: toLines(item.bullets),
  };
}

export default function ImportResumeModal({ open, onClose, onImport }) {
  const [file, setFile] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState(null);
  const [items, setItems] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState(null);

  const reset = () => {
    setFile(null);
    setParsing(false);
    setParseError(null);
    setItems(null);
    setImporting(false);
    setImportError(null);
  };

  const close = () => {
    reset();
    onClose();
  };

  const parse = async () => {
    if (!file) {
      alert('Choose a resume file first.');
      return;
    }
    setParsing(true);
    setParseError(null);
    try {
      const body = new FormData();
      body.set('resume', file);
      const res = await fetch('/api/parse-resume', { method: 'POST', body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not parse that resume.');
      setItems((data.result || []).map(toEditable));
    } catch (e) {
      setParseError(e.message || 'Could not parse that resume.');
    } finally {
      setParsing(false);
    }
  };

  const setItem = (key, field) => (e) => {
    const value = e.target.value;
    setItems((list) => list.map((it) => (it._key === key ? { ...it, [field]: value } : it)));
  };

  const removeItem = (key) => {
    setItems((list) => list.filter((it) => it._key !== key));
  };

  const commit = async () => {
    if (!items || items.length === 0) return;
    setImporting(true);
    setImportError(null);
    try {
      const payload = items.map((it) => ({
        org: it.org.trim(),
        role: it.role.trim(),
        type: it.type,
        start_date: it.start_date || null,
        end_date: it.end_date || null,
        location: it.location.trim() || null,
        summary: it.summary.trim() || null,
        tech_stack: fromCsv(it.tech_stack),
        tags: [],
        bullets: fromLines(it.bullets).map((text) => ({ text, tags: [] })),
      }));
      await onImport(payload);
      close();
    } catch (e) {
      setImportError(e.message || 'Failed to import experiences.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="Import experiences from a resume"
      footer={
        items ? (
          <>
            <button className="btn ghost" onClick={close}>Cancel</button>
            <button className="btn" onClick={commit} disabled={importing || items.length === 0}>
              {importing ? 'Importing…' : `Import ${items.length} experience${items.length === 1 ? '' : 's'}`}
            </button>
          </>
        ) : (
          <>
            <button className="btn ghost" onClick={close}>Cancel</button>
            <button className="btn" onClick={parse} disabled={parsing}>
              {parsing ? 'Parsing…' : 'Parse resume'}
            </button>
          </>
        )
      }
    >
      {!items ? (
        <div className="form-grid">
          <div className="full">
            <label>Resume file (PDF or .docx)</label>
            <input
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <p className="page-sub" style={{ marginTop: 10 }}>
              We'll extract the real experiences from this file — nothing is saved until you review and confirm below.
            </p>
            {parseError && <p className="auth-message error" style={{ marginTop: 10 }}>{parseError}</p>}
          </div>
        </div>
      ) : (
        <div>
          {importError && <p className="auth-message error" style={{ marginBottom: 12 }}>{importError}</p>}
          {items.length === 0 ? (
            <p className="page-sub">No experiences were found in that file.</p>
          ) : (
            items.map((it) => (
              <div
                key={it._key}
                style={{
                  border: '1px solid var(--line-soft)',
                  borderRadius: 8,
                  padding: 14,
                  marginBottom: 12,
                }}
              >
                <div className="form-grid">
                  <div>
                    <label>Organization</label>
                    <input type="text" value={it.org} onChange={setItem(it._key, 'org')} />
                  </div>
                  <div>
                    <label>Role</label>
                    <input type="text" value={it.role} onChange={setItem(it._key, 'role')} />
                  </div>
                  <div>
                    <label>Type</label>
                    <select value={it.type} onChange={setItem(it._key, 'type')}>
                      {TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label>Location</label>
                    <input type="text" value={it.location} onChange={setItem(it._key, 'location')} />
                  </div>
                  <div>
                    <label>Start date</label>
                    <input type="date" value={it.start_date} onChange={setItem(it._key, 'start_date')} />
                  </div>
                  <div>
                    <label>End date</label>
                    <input type="date" value={it.end_date} onChange={setItem(it._key, 'end_date')} />
                  </div>
                  <div className="full">
                    <label>Summary</label>
                    <textarea value={it.summary} onChange={setItem(it._key, 'summary')} />
                  </div>
                  <div className="full">
                    <label>Tech stack (comma separated)</label>
                    <input type="text" value={it.tech_stack} onChange={setItem(it._key, 'tech_stack')} />
                  </div>
                  <div className="full">
                    <label>Bullets (one per line)</label>
                    <textarea value={it.bullets} onChange={setItem(it._key, 'bullets')} style={{ minHeight: 90 }} />
                  </div>
                </div>
                <button
                  type="button"
                  className="btn ghost sm"
                  onClick={() => removeItem(it._key)}
                  style={{ marginTop: 8 }}
                >
                  Remove this entry
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </Modal>
  );
}
