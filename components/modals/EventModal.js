'use client';

import { useEffect, useState } from 'react';
import Modal from './Modal';
import { useStore } from '@/lib/store';
import { isoDate } from '@/lib/helpers';

const EMPTY = { title: '', type: 'interview', date: '', time: '', appId: '', notes: '' };

export default function EventModal({ open, onClose }) {
  const { applications, addEvent } = useStore();
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (!open) return;
    setForm({ ...EMPTY, date: isoDate() });
  }, [open]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = () => {
    if (!form.title.trim() || !form.date) {
      alert('Title and date are required.');
      return;
    }
    addEvent(form);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New event"
      footer={
        <>
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn" onClick={save}>Save</button>
        </>
      }
    >
      <div className="form-grid">
        <div className="full">
          <label>Title</label>
          <input type="text" value={form.title} onChange={set('title')} placeholder="e.g. Acme — Onsite, Round 2" />
        </div>
        <div>
          <label>Type</label>
          <select value={form.type} onChange={set('type')}>
            <option value="interview">Interview</option>
            <option value="oa">Online Assessment</option>
            <option value="ddl">Deadline</option>
          </select>
        </div>
        <div>
          <label>Date</label>
          <input type="date" value={form.date} onChange={set('date')} />
        </div>
        <div>
          <label>Time</label>
          <input type="time" value={form.time} onChange={set('time')} />
        </div>
        <div>
          <label>Linked application</label>
          <select value={form.appId} onChange={set('appId')}>
            <option value="">— None —</option>
            {applications.map((a) => (
              <option key={a.id} value={a.id}>{a.company} — {a.role}</option>
            ))}
          </select>
        </div>
        <div className="full">
          <label>Notes</label>
          <textarea value={form.notes} onChange={set('notes')} placeholder="Meeting link, prep checklist..." />
        </div>
      </div>
    </Modal>
  );
}
