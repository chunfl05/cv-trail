'use client';

import Icon from './Icon';
import { useStore } from '@/lib/store';

export default function Resumes({ onNew, onEdit }) {
  const { resumes, applications, deleteResume } = useStore();

  // Compute uses on the fly so we don't need to mutate state.
  const withUses = resumes.map((r) => ({
    ...r,
    uses: applications.filter((a) => a.resumeId === r.id).length,
  }));

  return (
    <section className="view active">
      <div className="page-header">
        <div>
          <div className="page-title">Resume Vault</div>
          <div className="page-sub">Tailored versions for different roles and industries.</div>
        </div>
        <button className="btn" onClick={onNew}>
          <Icon name="plus" size={14} strokeWidth={2} />
          New version
        </button>
      </div>

      {withUses.length === 0 ? (
        <div className="empty card">
          <div className="empty-icon">
            <Icon name="resumes" size={22} strokeWidth={1.5} />
          </div>
          <h3>No resume versions</h3>
          <p>
            Create different versions tailored to specific roles, industries, or seniority levels.
          </p>
          <button className="btn" onClick={onNew}>
            Add version
          </button>
        </div>
      ) : (
        <div className="resumes-grid">
          {withUses.map((r) => {
            const inUse = applications.some((a) => a.resumeId === r.id);
            return (
              <div className="resume-card" key={r.id}>
                <div className="resume-icon">
                  <Icon name="resumes" size={19} strokeWidth={1.6} />
                </div>
                <div className="resume-name">{r.name}</div>
                <div className="resume-target">{r.target || 'No target set'}</div>
                {r.notes && <div className="resume-notes">{r.notes}</div>}
                <div className="resume-foot">
                  <span className="resume-uses">
                    {r.uses === 1 ? '1 use' : r.uses + ' uses'}
                  </span>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    {r.link && (
                      <a
                        href={r.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: 'var(--accent)',
                          textDecoration: 'none',
                          fontSize: 12,
                          fontWeight: 500,
                          padding: '5px 11px',
                          borderRadius: 6,
                          border: '1px solid var(--accent)',
                        }}
                      >
                        Open ↗
                      </a>
                    )}
                    <button
                      className="icon-btn edit"
                      title="Edit"
                      onClick={() => onEdit(r)}
                    >
                      <Icon name="edit" size={14} strokeWidth={1.5} />
                    </button>
                    <button
                      className="icon-btn"
                      title="Delete"
                      onClick={() => {
                        const msg = inUse
                          ? 'This version is linked to applications. Delete anyway?'
                          : 'Delete this version?';
                        if (confirm(msg)) deleteResume(r.id);
                      }}
                    >
                      <Icon name="trash" size={14} strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
