'use client';

import { useStore } from '@/lib/store';
import { fmtDate, daysSince, isoDate } from '@/lib/helpers';

export default function RightRail() {
  const { events, applications } = useStore();

  const now = new Date();
  const weekStr = isoDate(new Date(now.getTime() + 7 * 86400000));
  const nowStr = isoDate(now);

  const upcoming = events
    .filter((e) => e.date >= nowStr && e.date <= weekStr)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 4);

  const stale = applications
    .filter((a) => a.status === 'applied' && daysSince(a.date) > 14)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 4);

  return (
    <aside className="right-rail">
      <div className="rail-card">
        <div className="rail-title">This week</div>
        <div>
          {upcoming.length === 0 ? (
            <div className="rail-empty">Nothing this week.</div>
          ) : (
            upcoming.map((e) => (
              <div className="rail-item" key={e.id}>
                <div className="rail-item-title">{e.title}</div>
                <div className="rail-item-meta">
                  {fmtDate(e.date)}
                  {e.time ? ' · ' + e.time : ''}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="rail-card">
        <div className="rail-title">Needs follow-up</div>
        <div>
          {stale.length === 0 ? (
            <div className="rail-empty">All clear.</div>
          ) : (
            stale.map((a) => (
              <div className="rail-item" key={a.id}>
                <div className="rail-item-title">{a.company}</div>
                <div className="rail-item-meta">
                  Waiting {daysSince(a.date)} days · {a.role}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div
        className="rail-card"
        style={{ fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.6 }}
      >
        <div
          style={{
            fontFamily: "'Source Serif 4', serif",
            fontWeight: 600,
            color: 'var(--ink)',
            marginBottom: 6,
            fontSize: 13,
          }}
        >
          About CV Trail
        </div>
        Your data stays in your browser. Nothing leaves your device unless you choose to export it.
      </div>
    </aside>
  );
}
