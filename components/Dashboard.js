'use client';

import Icon from './Icon';
import Sankey from './Sankey';
import KanbanBoard from './KanbanBoard';
import { useStore } from '@/lib/store';
import { greeting, daysSince } from '@/lib/helpers';

export default function Dashboard({ onNew, onEdit, onSwitch }) {
  const { applications } = useStore();
  const apps = applications;
  const total = apps.length;
  const active = apps.filter((a) =>
    ['applied', 'screening', 'interview'].includes(a.status)
  ).length;
  const replied = apps.filter((a) => !['applied', 'ghosted'].includes(a.status)).length;
  const rate = total ? Math.round((replied / total) * 100) : null;
  const waits = apps.filter((a) => a.status === 'applied').map((a) => daysSince(a.date));
  const avgWait = waits.length
    ? Math.round(waits.reduce((s, x) => s + x, 0) / waits.length)
    : null;
  const uniqueCompanies = new Set(apps.map((a) => a.company)).size;

  return (
    <section className="view active">
      <div className="page-header">
        <div>
          <div className="page-title">{greeting()}</div>
          <div className="page-sub">A quiet look at where things stand today.</div>
        </div>
        <button className="btn" onClick={onNew}>
          <Icon name="plus" size={14} strokeWidth={2} />
          New application
        </button>
      </div>

      <div className="stats">
        <div className="stat">
          <div className="stat-label">Total Sent</div>
          <div className="stat-value">{total}</div>
          <div className="stat-trend">{total ? `${uniqueCompanies} unique companies` : '—'}</div>
        </div>
        <div className="stat">
          <div className="stat-label">In Progress</div>
          <div className="stat-value">{active}</div>
          <div className="stat-trend">Screening · Interview</div>
        </div>
        <div className="stat">
          <div className="stat-label">Response Rate</div>
          <div className="stat-value">{rate !== null ? rate + '%' : '—'}</div>
          <div className="stat-trend">{total ? `${replied} of ${total} replied` : '—'}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Avg. Wait</div>
          <div className="stat-value">{avgWait !== null ? avgWait + 'd' : '—'}</div>
          <div className="stat-trend">Days since applied</div>
        </div>
      </div>

      <div className="section-label">Flow visualization</div>
      <Sankey apps={apps} />

      <div className="section-label">Pipeline</div>
      <div className="card">
        <div className="card-head">
          <div className="card-title">Current pipeline</div>
          <button className="btn outline sm" onClick={() => onSwitch('applications')}>
            View all
          </button>
        </div>
        <div className="card-body" style={{ padding: 16 }}>
          <KanbanBoard apps={apps} onCardClick={onEdit} />
        </div>
      </div>
    </section>
  );
}
