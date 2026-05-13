'use client';

import { useEffect, useState } from 'react';
import Modal from './Modal';
import { useStore } from '@/lib/store';
import { isoDate } from '@/lib/helpers';

const EMPTY = {
  company: '',
  role: '',
  channel: 'LinkedIn',
  status: 'applied',
  date: isoDate(),
  resumeId: '',
  notes: '',
};

export default function ApplicationModal({ open, editing, onClose }) {
  const { resumes, addApplication, updateApplication } = useStore();
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setForm({
        company: editing.company || '',
        role: editing.role || '',
        channel: editing.channel || 'LinkedIn',
        status: editing.status || 'applied',
        date: editing.date || isoDate(),
        resumeId: editing.resumeId || '',
        notes: editing.notes || '',
      });
    } else {
      setForm({ ...EMPTY, date: isoDate() });
    }
  }, [open, editing]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = () => {
    if (!form.company.trim() || !form.role.trim()) {
      alert('Company and role are required.');
      return;
    }
    if (editing) {
      updateApplication(editing.id, form);
    } else {
      addApplication(form);
    }
    onClose();
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
          <input type="text" value={form.role} onChange={set('role')} placeholder="e.g. Senior Product Manager" />
        </div>
        <div>
          <label>Channel</label>
          <select value={form.channel} onChange={set('channel')}>
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
            <option value="rejected">Rejected</option>
            <option value="ghosted">Ghosted</option>
          </select>
        </div>
        <div>
          <label>Applied on</label>
          <input type="date" value={form.date} onChange={set('date')} />
        </div>
        <div>
          <label>Resume version</label>
          <select value={form.resumeId} onChange={set('resumeId')}>
            <option value="">— None —</option>
            {resumes.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
        <div className="full">
          <label>Notes</label>
          <textarea
            value={form.notes}
            onChange={set('notes')}
            placeholder="JD link, recruiter name, anything worth remembering..."
          />
        </div>
      </div>
    </Modal>
  );
}
