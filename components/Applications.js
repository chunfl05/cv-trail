'use client';

import { useState } from 'react';
import Icon from './Icon';
import { useStore } from '@/lib/store';
import {
  daysSince,
  fmtDate,
  statusLabel,
  getInitials,
} from '@/lib/helpers';

export default function Applications({ onNew, onEdit }) {
  const { applications, resumes, cycleApplicationStatus, deleteApplication } = useStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [channelFilter, setChannelFilter] = useState('');

  const filtered = applications
    .filter(
      (a) =>
        !search ||
        a.company.toLowerCase().includes(search.toLowerCase()) ||
        a.role.toLowerCase().includes(search.toLowerCase())
    )
    .filter((a) => !statusFilter || a.status === statusFilter)
    .filter((a) => !channelFilter || a.channel === channelFilter)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <section className="view active">
      <div className="page-header">
        <div>
          <div className="page-title">Applications</div>
          <div className="page-sub">Every company, every role, every status.</div>
        </div>
        <button className="btn" onClick={onNew}>
          <Icon name="plus" size={14} strokeWidth={2} />
          New application
        </button>
      </div>

      <div className="filter-bar">
        <input
          type="search"
          placeholder="Search company or role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="applied">Applied</option>
          <option value="screening">Screening</option>
          <option value="interview">Interview</option>
          <option value="offer">Offer</option>
          <option value="rejected">Rejected</option>
          <option value="ghosted">Ghosted</option>
        </select>
        <select value={channelFilter} onChange={(e) => setChannelFilter(e.target.value)}>
          <option value="">All channels</option>
          <option value="LinkedIn">LinkedIn</option>
          <option value="Referral">Referral</option>
          <option value="Company site">Company site</option>
          <option value="Indeed">Indeed</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div className="card">
        {filtered.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">
              <Icon name="tableEmpty" size={22} strokeWidth={1.5} />
            </div>
            <h3>No applications yet</h3>
            <p>Add your first application to start tracking your job search.</p>
            <button className="btn" onClick={onNew}>
              Add application
            </button>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Company / Role</th>
                  <th>Channel</th>
                  <th>Status</th>
                  <th>Resume</th>
                  <th>Applied</th>
                  <th>Wait</th>
                  <th style={{ width: 40 }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => {
                  const wait = daysSince(a.date);
                  const res = resumes.find((r) => r.id === a.resumeId);
                  return (
                    <tr key={a.id}>
                      <td onClick={() => onEdit(a)} style={{ cursor: 'pointer' }}>
                        <div className="company-cell">
                          <div className="company-avatar">{getInitials(a.company)}</div>
                          <div>
                            <div className="company">{a.company}</div>
                            <div className="role">{a.role}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="tag">{a.channel || '—'}</span>
                      </td>
                      <td>
                        <button
                          className={`status-pill status-${a.status}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            cycleApplicationStatus(a.id);
                          }}
                        >
                          {statusLabel(a.status)}
                        </button>
                      </td>
                      <td style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>
                        {res ? res.name : <span style={{ color: 'var(--ink-4)' }}>—</span>}
                      </td>
                      <td
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 12,
                          color: 'var(--ink-3)',
                        }}
                      >
                        {fmtDate(a.date)}
                      </td>
                      <td
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 12,
                          color:
                            wait > 14 && a.status === 'applied'
                              ? 'var(--danger)'
                              : 'var(--ink-3)',
                        }}
                      >
                        {wait}d
                      </td>
                      <td>
                        <button
                          className="icon-btn"
                          title="Delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Remove this application?')) {
                              deleteApplication(a.id);
                            }
                          }}
                        >
                          <Icon name="trash" size={14} strokeWidth={1.5} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
