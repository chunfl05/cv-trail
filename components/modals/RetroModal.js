'use client';

import { useEffect, useState } from 'react';
import Modal from './Modal';
import { useStore } from '@/lib/store';
import { isoDate } from '@/lib/helpers';

const EMPTY = {
  appId: '',
  date: '',
  round: '',
  outcome: 'pending',
  rating: '3',
  questions: '',
  notes: '',
};

export default function RetroModal({ open, onClose }) {
  const { applications, addRetro } = useStore();
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (!open) return;
    setForm({ ...EMPTY, date: isoDate() });
  }, [open]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = () => {
    if (!form.date) {
      alert('Date is required.');
      return;
    }
    addRetro({ ...form, rating: Number(form.rating) });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Log interview"
      footer={
        <>
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn" onClick={save}>Save</button>
        </>
      }
    >
      <div className="form-grid">
        <div>
          <label>Application</label>
          <select value={form.appId} onChange={set('appId')}>
            <option value="">— None —</option>
            {applications.map((a) => (
              <option key={a.id} value={a.id}>{a.company} — {a.role}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Date</label>
          <input type="date" value={form.date} onChange={set('date')} />
        </div>
        <div>
          <label>Round</label>
          <input type="text" value={form.round} onChange={set('round')} placeholder="e.g. Phone screen, Onsite 2" />
        </div>
        <div>
          <label>Outcome</label>
          <select value={form.outcome} onChange={set('outcome')}>
            <option value="pending">Pending</option>
            <option value="passed">Passed</option>
            <option value="failed">Did not advance</option>
          </select>
        </div>
        <div className="full">
          <label>Self-rating (1–5)</label>
          <select value={form.rating} onChange={set('rating')}>
            <option value="3">3 — Okay</option>
            <option value="1">1 — Rough</option>
            <option value="2">2 — Could be better</option>
            <option value="4">4 — Strong</option>
            <option value="5">5 — Nailed it</option>
          </select>
        </div>
        <div className="full">
          <label>Questions asked</label>
          <textarea
            value={form.questions}
            onChange={set('questions')}
            placeholder="The questions you remember. One per line."
          />
        </div>
        <div className="full">
          <label>Reflection</label>
          <textarea
            value={form.notes}
            onChange={set('notes')}
            placeholder="What went well, what didn't, what to do differently..."
          />
        </div>
      </div>
    </Modal>
  );
}
