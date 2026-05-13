'use client';

import { useState } from 'react';
import Icon from './Icon';
import { useStore } from '@/lib/store';
import { isoDate } from '@/lib/helpers';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Calendar({ onNew }) {
  const { events, deleteEvent } = useStore();
  const today = new Date();
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [calYear, setCalYear] = useState(today.getFullYear());

  const shiftMonth = (dir) => {
    let m = calMonth + dir;
    let y = calYear;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setCalMonth(m);
    setCalYear(y);
  };
  const goToday = () => {
    setCalMonth(today.getMonth());
    setCalYear(today.getFullYear());
  };

  const startDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const prevMonthDays = new Date(calYear, calMonth, 0).getDate();
  const isToday = (y, m, d) =>
    y === today.getFullYear() && m === today.getMonth() && d === today.getDate();

  const cells = [];
  // Day name headers
  DAY_NAMES.forEach((n) => cells.push({ type: 'name', name: n }));
  // Leading filler
  for (let i = 0; i < startDay; i++) {
    cells.push({ type: 'muted', num: prevMonthDays - startDay + i + 1 });
  }
  // Real days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayEvents = events.filter((e) => e.date === dateStr);
    cells.push({
      type: 'day',
      num: d,
      today: isToday(calYear, calMonth, d),
      events: dayEvents,
    });
  }
  // Trailing filler
  const trailing = (7 - ((startDay + daysInMonth) % 7)) % 7;
  for (let i = 1; i <= trailing; i++) {
    cells.push({ type: 'muted', num: i });
  }

  const nowStr = isoDate(today);
  const upcoming = events
    .filter((e) => e.date >= nowStr)
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || '')
    )
    .slice(0, 8);

  return (
    <section className="view active">
      <div className="page-header">
        <div>
          <div className="page-title">Calendar</div>
          <div className="page-sub">Interviews, assessments, and deadlines.</div>
        </div>
        <button className="btn" onClick={onNew}>
          <Icon name="plus" size={14} strokeWidth={2} />
          New event
        </button>
      </div>

      <div className="card">
        <div className="card-head">
          <div className="cal-nav">
            <button className="cal-arrow" onClick={() => shiftMonth(-1)}>‹</button>
            <div className="cal-month">
              {MONTH_NAMES[calMonth]}
              <span>{calYear}</span>
            </div>
            <button className="cal-arrow" onClick={() => shiftMonth(1)}>›</button>
            <button className="btn ghost sm" onClick={goToday} style={{ marginLeft: 8 }}>
              Today
            </button>
          </div>
        </div>
        <div className="card-body" style={{ padding: 16 }}>
          <div className="calendar">
            {cells.map((c, i) => {
              if (c.type === 'name') {
                return <div className="cal-day-name" key={`n${i}`}>{c.name}</div>;
              }
              if (c.type === 'muted') {
                return (
                  <div className="cal-cell muted" key={`m${i}`}>
                    <span className="cal-num">{c.num}</span>
                  </div>
                );
              }
              return (
                <div className={`cal-cell ${c.today ? 'today' : ''}`} key={`d${i}`}>
                  <span className="cal-num">{c.num}</span>
                  {c.events.slice(0, 3).map((e) => (
                    <div className={`cal-event ${e.type}`} title={e.title} key={e.id}>
                      {e.title}
                    </div>
                  ))}
                  {c.events.length > 3 && (
                    <div
                      className="cal-event"
                      style={{ background: 'transparent', color: 'var(--ink-3)' }}
                    >
                      +{c.events.length - 3} more
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div className="card-title">Upcoming</div>
        </div>
        <div className="card-body">
          {upcoming.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                color: 'var(--ink-3)',
                padding: '24px 0',
                fontSize: 13,
              }}
            >
              No upcoming events.
            </div>
          ) : (
            upcoming.map((e) => {
              const typeLabel =
                { interview: 'Interview', oa: 'Assessment', ddl: 'Deadline' }[e.type] || 'Event';
              return (
                <div className="upcoming-item" key={e.id}>
                  <div className="date-block">
                    <div className="m">
                      {new Date(e.date).toLocaleDateString('en-US', { month: 'short' })}
                    </div>
                    <div className="d">{new Date(e.date).getDate()}</div>
                  </div>
                  <div className="event-info">
                    <div className="event-title">{e.title}</div>
                    <div className="event-meta">
                      {typeLabel}
                      {e.time ? ' · ' + e.time : ''}
                    </div>
                  </div>
                  <button
                    className="icon-btn"
                    onClick={() => {
                      if (confirm('Remove this event?')) deleteEvent(e.id);
                    }}
                  >
                    <Icon name="trash" size={14} strokeWidth={1.5} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
