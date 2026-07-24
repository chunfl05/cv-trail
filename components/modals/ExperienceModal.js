'use client';

import { useEffect, useState } from 'react';
import Modal from './Modal';

const EMPTY = {
  org: '',
  role: '',
  type: 'job',
  start_date: '',
  end_date: '',
  location: '',
  summary: '',
  tech_stack: '',
  tags: '',
  bullets: [{ text: '', tags: '' }],
};

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
  return str
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function ExperienceModal({ open, editing, onClose, onSave }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setForm({
        org: editing.org || '',
        role: editing.role || '',
        type: editing.type || 'job',
        start_date: editing.start_date || '',
        end_date: editing.end_date || '',
        location: editing.location || '',
        summary: editing.summary || '',
        tech_stack: toCsv(editing.tech_stack),
        tags: toCsv(editing.tags),
        bullets:
          editing.bullets && editing.bullets.length
            ? editing.bullets.map((b) => ({ text: b.text || '', tags: toCsv(b.tags) }))
            : [{ text: '', tags: '' }],
      });
    } else {
      setForm(EMPTY);
    }
  }, [open, editing]);

  const set = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm({ ...form, [k]: v });
  };

  const setBullet = (i, k) => (e) => {
    const bullets = form.bullets.slice();
    bullets[i] = { ...bullets[i], [k]: e.target.value };
    setForm({ ...form, bullets });
  };

  const addBullet = () => setForm({ ...form, bullets: [...form.bullets, { text: '', tags: '' }] });

  const removeBullet = (i) => () =>
    setForm({ ...form, bullets: form.bullets.filter((_, idx) => idx !== i) });

  const save = async () => {
    if (!form.org.trim() || !form.role.trim()) {
      alert('Organization and role are required.');
      return;
    }
    const payload = {
      org: form.org.trim(),
      role: form.role.trim(),
      type: form.type,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      location: form.location.trim() || null,
      summary: form.summary.trim() || null,
      tech_stack: fromCsv(form.tech_stack),
      tags: fromCsv(form.tags),
      bullets: form.bullets
        .filter((b) => b.text.trim())
        .map((b) => ({ text: b.text.trim(), tags: fromCsv(b.tags) })),
    };
    setSaving(true);
    try {
      await onSave(payload);
      onClose();
    } catch (e) {
      alert(e.message || 'Failed to save experience.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Edit experience' : 'New experience'}
      footer={
        <>
          <button className="btn ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </>
      }
    >
      <div className="form-grid">
        <div>
          <label>Organization</label>
          <input type="text" value={form.org} onChange={set('org')} placeholder="e.g. Acme Inc." />
        </div>
        <div>
          <label>Role</label>
          <input type="text" value={form.role} onChange={set('role')} placeholder="e.g. Product Intern" />
        </div>
        <div>
          <label>Type</label>
          <select value={form.type} onChange={set('type')}>
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Location</label>
          <input type="text" value={form.location} onChange={set('location')} placeholder="e.g. Remote" />
        </div>
        <div>
          <label>Start date</label>
          <input type="date" value={form.start_date} onChange={set('start_date')} />
        </div>
        <div>
          <label>End date</label>
          <input type="date" value={form.end_date} onChange={set('end_date')} />
        </div>
        <div className="full">
          <label>Summary</label>
          <textarea value={form.summary} onChange={set('summary')} placeholder="One or two lines on scope and context." />
        </div>
        <div className="full">
          <label>Tech stack (comma separated)</label>
          <input type="text" value={form.tech_stack} onChange={set('tech_stack')} placeholder="e.g. Python, SQL, React" />
        </div>
        <div className="full">
          <label>Tags (comma separated)</label>
          <input type="text" value={form.tags} onChange={set('tags')} placeholder="e.g. data, growth, frontend" />
        </div>
        <div className="full">
          <label>Achievement bullets</label>
          {form.bullets.map((b, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
              <input
                type="text"
                value={b.text}
                onChange={setBullet(i, 'text')}
                placeholder="What did you do / achieve?"
                style={{ flex: 2 }}
              />
              <input
                type="text"
                value={b.tags}
                onChange={setBullet(i, 'tags')}
                placeholder="tags"
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className="icon-btn"
                title="Remove bullet"
                onClick={removeBullet(i)}
                disabled={form.bullets.length === 1}
              >
                ×
              </button>
            </div>
          ))}
          <button type="button" className="btn ghost sm" onClick={addBullet}>
            + Add bullet
          </button>
        </div>
      </div>
    </Modal>
  );
}
