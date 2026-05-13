'use client';

import { useEffect, useState } from 'react';
import Modal from './Modal';
import { useStore } from '@/lib/store';

const EMPTY = { name: '', target: '', notes: '', link: '' };

export default function ResumeModal({ open, editing, onClose }) {
  const { addResume, updateResume } = useStore();
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setForm({
        name: editing.name || '',
        target: editing.target || '',
        notes: editing.notes || '',
        link: editing.link || '',
      });
    } else {
      setForm(EMPTY);
    }
  }, [open, editing]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = () => {
    if (!form.name.trim()) {
      alert('Version name is required.');
      return;
    }
    if (editing) {
      updateResume(editing.id, form);
    } else {
      addResume(form);
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Edit version' : 'New resume version'}
      footer={
        <>
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn" onClick={save}>Save</button>
        </>
      }
    >
      <div className="form-grid">
        <div className="full">
          <label>Version name</label>
          <input type="text" value={form.name} onChange={set('name')} placeholder="e.g. Senior PM — Fintech" />
        </div>
        <div className="full">
          <label>Target role / industry</label>
          <input type="text" value={form.target} onChange={set('target')} placeholder="e.g. PM roles in fintech, B2B" />
        </div>
        <div className="full">
          <label>Notes</label>
          <textarea value={form.notes} onChange={set('notes')} placeholder="What's different about this version?" />
        </div>
        <div className="full">
          <label>Link</label>
          <input type="url" value={form.link} onChange={set('link')} placeholder="Drive / Notion / Dropbox URL" />
        </div>
      </div>
    </Modal>
  );
}
