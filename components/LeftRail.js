'use client';

import Icon from './Icon';
import { useStore } from '@/lib/store';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', count: null },
  { id: 'applications', label: 'Applications', icon: 'applications', count: 'apps' },
  { id: 'resumes', label: 'Resumes', icon: 'resumes', count: 'resumes' },
  { id: 'calendar', label: 'Calendar', icon: 'calendar', count: null },
  { id: 'retrospective', label: 'Insights', icon: 'insights', count: 'retros' },
];

export default function LeftRail({ view, onSwitch }) {
  const { applications, resumes, retros } = useStore();
  const counts = {
    apps: applications.length,
    resumes: resumes.length,
    retros: retros.length,
  };
  const active = applications.filter((a) =>
    ['applied', 'screening', 'interview'].includes(a.status)
  ).length;

  return (
    <aside className="left-rail">
      <div className="profile-card">
        <div className="profile-avatar">CV</div>
        <div className="profile-name">Your Job Search</div>
        <div className="profile-headline">
          A quiet record of every application, interview, and reflection.
        </div>
        <div className="profile-divider" />
        <div className="profile-stats">
          <div>
            <div className="profile-stat-label">Sent</div>
            <div className="profile-stat-value">{applications.length}</div>
          </div>
          <div>
            <div className="profile-stat-label">Active</div>
            <div className="profile-stat-value">{active}</div>
          </div>
        </div>
      </div>

      <div className="nav-card">
        <div className="nav-section-label">Workspace</div>
        {NAV_ITEMS.map((item) => (
          <div
            key={item.id}
            className={`nav-item ${view === item.id ? 'active' : ''}`}
            onClick={() => onSwitch(item.id)}
          >
            <Icon name={item.icon} size={17} strokeWidth={1.7} className="nav-icon" />
            {item.label}
            {item.count !== null && <span className="nav-count">{counts[item.count]}</span>}
          </div>
        ))}
      </div>
    </aside>
  );
}
