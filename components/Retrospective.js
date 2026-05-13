'use client';

import Icon from './Icon';
import { useStore } from '@/lib/store';
import { fmtDate } from '@/lib/helpers';

export default function Retrospective({ onNew }) {
  const { retros, applications, deleteRetro } = useStore();

  const done = retros.filter((r) => r.outcome !== 'pending');
  const passed = done.filter((r) => r.outcome === 'passed').length;
  const passRate = done.length ? `${Math.round((passed / done.length) * 100)}%` : '—';
  const ratings = retros.map((r) => Number(r.rating)).filter((n) => !isNaN(n));
  const avg = ratings.length
    ? (ratings.reduce((s, x) => s + x, 0) / ratings.length).toFixed(1)
    : '—';

  const sorted = [...retros].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  return (
    <section className="view active">
      <div className="page-header">
        <div>
          <div className="page-title">Interview Insights</div>
          <div className="page-sub">Reflect on performance, refine your approach.</div>
        </div>
        <button className="btn" onClick={onNew}>
          <Icon name="plus" size={14} strokeWidth={2} />
          Log interview
        </button>
      </div>

      <div className="stats" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat">
          <div className="stat-label">Interviews Logged</div>
          <div className="stat-value">{retros.length}</div>
          <div className="stat-trend">Total reflections</div>
        </div>
        <div className="stat">
          <div className="stat-label">Advancement Rate</div>
          <div className="stat-value">{passRate}</div>
          <div className="stat-trend">With outcome</div>
        </div>
        <div className="stat">
          <div className="stat-label">Avg. Self-Rating</div>
          <div className="stat-value">{avg}</div>
          <div className="stat-trend">Out of 5</div>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="empty card">
          <div className="empty-icon">
            <Icon name="insights" size={22} strokeWidth={1.5} />
          </div>
          <h3>No reflections yet</h3>
          <p>After each interview, log the questions asked, your performance, and the outcome.</p>
          <button className="btn" onClick={onNew}>
            Log first interview
          </button>
        </div>
      ) : (
        <div>
          {sorted.map((r) => {
            const app = applications.find((a) => a.id === r.appId);
            const outcomeLabel =
              r.outcome === 'passed'
                ? 'Advanced'
                : r.outcome === 'failed'
                ? 'Did not advance'
                : 'Pending';
            return (
              <div className="retro-item" key={r.id}>
                <div>
                  <div className="retro-head">
                    <span className="retro-co">
                      {app ? `${app.company} — ${app.role}` : 'Standalone interview'}
                    </span>
                    <span className="retro-date">
                      {fmtDate(r.date)}
                      {r.round ? ' · ' + r.round : ''}
                    </span>
                    <span className={`retro-result ${r.outcome}`}>{outcomeLabel}</span>
                  </div>
                  {r.questions && <div className="retro-q">{r.questions}</div>}
                  {r.notes && <div className="retro-notes">{r.notes}</div>}
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: 8,
                  }}
                >
                  <div className="retro-rating">
                    <span className="val">{r.rating}</span>
                    <span className="out">/5</span>
                  </div>
                  <button
                    className="icon-btn"
                    onClick={() => {
                      if (confirm('Remove this reflection?')) deleteRetro(r.id);
                    }}
                  >
                    <Icon name="trash" size={14} strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
