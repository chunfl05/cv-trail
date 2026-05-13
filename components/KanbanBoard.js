'use client';

import { daysSince, fmtDate, dotColor } from '@/lib/helpers';

const COLS = [
  { key: 'applied', title: 'Applied' },
  { key: 'screening', title: 'Screening' },
  { key: 'interview', title: 'Interview' },
  { key: 'offer', title: 'Offer' },
  { key: 'rejected', title: 'Closed' },
];

export default function KanbanBoard({ apps, onCardClick }) {
  return (
    <div className="board">
      {COLS.map((c) => {
        const list = apps.filter((a) =>
          c.key === 'rejected'
            ? ['rejected', 'ghosted'].includes(a.status)
            : a.status === c.key
        );
        return (
          <div className="column" key={c.key}>
            <div className="column-head">
              <span className="col-dot" style={{ background: dotColor(c.key) }} />
              <span className="col-title">{c.title}</span>
              <span className="col-count">{list.length}</span>
            </div>
            {list.length === 0 ? (
              <div className="col-empty">No items</div>
            ) : (
              list.map((a) => {
                const wait = daysSince(a.date);
                const warn = a.status === 'applied' && wait > 14;
                return (
                  <div
                    key={a.id}
                    className="kanban-card"
                    onClick={() => onCardClick(a)}
                  >
                    <div className="kc-company">{a.company}</div>
                    <div className="kc-role">{a.role}</div>
                    <div className="kc-meta">
                      <span>{fmtDate(a.date)}</span>
                      <span className={`wait-badge ${warn ? 'warn' : ''}`}>{wait}d</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        );
      })}
    </div>
  );
}
