'use client';

import { useState } from 'react';
import Icon from './Icon';
import { useExperiences } from '@/lib/experiences';
import { fmtDateRange } from '@/lib/helpers';
import ExperienceModal from './modals/ExperienceModal';
import ImportResumeModal from './modals/ImportResumeModal';

const TYPE_LABELS = {
  internship: 'Internship',
  job: 'Job',
  project: 'Project',
  education: 'Education',
};

export default function ExperienceBank() {
  const {
    experiences,
    loading,
    error,
    addExperience,
    addExperiences,
    updateExperience,
    deleteExperience,
  } = useExperiences();
  const [modal, setModal] = useState({ open: false, editing: null });
  const [importOpen, setImportOpen] = useState(false);

  const openNew = () => setModal({ open: true, editing: null });
  const openEdit = (exp) => setModal({ open: true, editing: exp });
  const close = () => setModal({ open: false, editing: null });

  const save = async (payload) => {
    if (modal.editing) {
      await updateExperience(modal.editing.id, payload);
    } else {
      await addExperience(payload);
    }
  };

  const remove = async (exp) => {
    if (!confirm(`Delete "${exp.role} @ ${exp.org}"?`)) return;
    try {
      await deleteExperience(exp.id);
    } catch (e) {
      alert(e.message || 'Failed to delete experience.');
    }
  };

  return (
    <section className="view active">
      <div className="page-header">
        <div>
          <div className="page-title">Experience Bank</div>
          <div className="page-sub">
            Every internship, job, project, and course — the AI's memory for tailoring resumes.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn ghost" onClick={() => setImportOpen(true)}>
            Import from resume
          </button>
          <button className="btn" onClick={openNew}>
            <Icon name="plus" size={14} strokeWidth={2} />
            New experience
          </button>
        </div>
      </div>

      {error && <div className="empty card"><p>{error}</p></div>}

      {!error && !loading && experiences.length === 0 && (
        <div className="empty card">
          <div className="empty-icon">
            <Icon name="experiences" size={22} strokeWidth={1.5} />
          </div>
          <h3>No experiences yet</h3>
          <p>Add every internship, job, project, and course so the AI has real material to draw from.</p>
          <button className="btn" onClick={openNew}>
            Add experience
          </button>
        </div>
      )}

      {!error && experiences.length > 0 && (
        <div className="resumes-grid">
          {experiences.map((exp) => (
            <div className="resume-card" key={exp.id}>
              <div className="resume-icon">
                <Icon name="experiences" size={19} strokeWidth={1.6} />
              </div>
              <div className="resume-name">
                {exp.role} — {exp.org}
              </div>
              <div className="resume-target">
                {TYPE_LABELS[exp.type] || exp.type} · {fmtDateRange(exp.start_date, exp.end_date)}
                {exp.location ? ` · ${exp.location}` : ''}
              </div>
              {exp.summary && <div className="resume-notes">{exp.summary}</div>}
              {exp.tech_stack?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                  {exp.tech_stack.map((t) => (
                    <span className="tag" key={t}>{t}</span>
                  ))}
                </div>
              )}
              {exp.bullets?.length > 0 && (
                <ul style={{ margin: '0 0 12px', paddingLeft: 18, fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.55 }}>
                  {exp.bullets.map((b, i) => (
                    <li key={i}>{b.text}</li>
                  ))}
                </ul>
              )}
              <div className="resume-foot">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {exp.tags?.map((t) => (
                    <span className="tag" key={t}>{t}</span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <button className="icon-btn edit" title="Edit" onClick={() => openEdit(exp)}>
                    <Icon name="edit" size={14} strokeWidth={1.5} />
                  </button>
                  <button className="icon-btn" title="Delete" onClick={() => remove(exp)}>
                    <Icon name="trash" size={14} strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ExperienceModal open={modal.open} editing={modal.editing} onClose={close} onSave={save} />
      <ImportResumeModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={addExperiences}
      />
    </section>
  );
}
