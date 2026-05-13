'use client';

import Icon from './Icon';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'applications', label: 'Applications', icon: 'applications' },
  { id: 'resumes', label: 'Resumes', icon: 'resumes' },
  { id: 'calendar', label: 'Calendar', icon: 'calendar' },
  { id: 'retrospective', label: 'Insights', icon: 'insights' },
];

export default function TopBar({ view, onSwitch }) {
  return (
    <div className="topbar">
      <div className="topbar-brand" onClick={() => onSwitch('dashboard')}>
        <div className="brand-mark">CV</div>
        <div className="brand-text">
          CV Trail<span className="brand-text-sub">Tracker</span>
        </div>
      </div>
      <div className="topbar-nav">
        {TABS.map((t) => (
          <div
            key={t.id}
            className={`topbar-action ${view === t.id ? 'active' : ''}`}
            onClick={() => onSwitch(t.id)}
          >
            <Icon name={t.icon} size={15} strokeWidth={1.6} />
            {t.label}
          </div>
        ))}
      </div>
    </div>
  );
}
