'use client';

import { daysSince } from '@/lib/helpers';

/**
 * Single-stage flow: Applications → current pipeline stage.
 *
 * The old multi-round "rejected at interview / second round / third round"
 * breakdown relied on distinct rejected/ghosted statuses to infer how far an
 * application got before it stopped. The 5-value status model (applied /
 * screening / interview / offer / closed) only tracks *current* stage, not
 * history, so a closed application can no longer be attributed to the round
 * it closed at — this now shows the current distribution instead.
 */
export default function Sankey({ apps }) {
  const total = apps.length;

  if (total === 0) {
    return (
      <div className="sankey-card">
        <div className="card-head">
          <div>
            <div className="card-title">Where applications go</div>
            <div className="card-sub">From submission to outcome — visualized as flow.</div>
          </div>
          <div className="tag">—</div>
        </div>
        <div className="sankey-container">
          <svg id="sankey-svg" viewBox="0 0 1100 440" preserveAspectRatio="xMidYMid meet">
            <text x="550" y="200" textAnchor="middle" className="sankey-empty-title">
              Your application flow will appear here
            </text>
            <text x="550" y="225" textAnchor="middle" className="sankey-empty-sub">
              Add applications to see how they progress through stages.
            </text>
          </svg>
        </div>
      </div>
    );
  }

  // === Compute flow values (current status distribution — mutually exclusive) ===
  const screening = apps.filter((a) => a.status === 'screening').length;
  const interview = apps.filter((a) => a.status === 'interview').length;
  const offers = apps.filter((a) => a.status === 'offer').length;
  const closed = apps.filter((a) => a.status === 'closed').length;
  const stillPending = apps.filter(
    (a) => a.status === 'applied' && daysSince(a.applied_date) <= 30
  ).length;
  const noAnswer = apps.filter(
    (a) => a.status === 'applied' && daysSince(a.applied_date) > 30
  ).length;

  const conv = ((offers / total) * 100).toFixed(1) + '% offer rate';

  // === Layout ===
  const W = 1100,
    H = 440;
  const padding = { top: 30, right: 150, bottom: 30, left: 130 };
  const nodeW = 14;
  const usableH = H - padding.top - padding.bottom;
  const unit = (usableH - 40) / Math.max(total, 1);

  const cols = [padding.left, W - padding.right];

  const GAP = 14;

  function makeNodes(items, x) {
    let y = padding.top;
    return items
      .map((item) => {
        const h = Math.max(item.value * unit, item.value > 0 ? 8 : 0);
        const node = { ...item, x, y, h };
        if (item.value > 0) y += h + GAP;
        return node;
      })
      .filter((n) => n.value > 0);
  }

  const col0 = makeNodes(
    [{ id: 'applied', label: 'Applications', value: total, color: 'var(--sk-applied)', textColor: '#64748B' }],
    cols[0]
  );

  const col1 = makeNodes(
    [
      { id: 'pending', label: 'Pending', value: stillPending, color: 'var(--sk-applied)', textColor: '#64748B' },
      { id: 'noAnswer', label: 'No Answer', value: noAnswer, color: 'var(--sk-noanswer)', textColor: '#8CA3BD' },
      { id: 'screening', label: 'Screening', value: screening, color: 'var(--sk-interview)', textColor: '#4E7FA8' },
      { id: 'interview', label: 'Interview', value: interview, color: 'var(--sk-second)', textColor: '#3D6690' },
      { id: 'offers', label: 'Offer', value: offers, color: 'var(--sk-offer)', textColor: '#1E4E8C' },
      { id: 'closed', label: 'Closed', value: closed, color: 'var(--sk-rejected)', textColor: '#64748B' },
    ],
    cols[1]
  );

  // === Links ===
  const links = [];

  function buildLinks(srcCol, srcId, targets) {
    const src = srcCol.find((n) => n.id === srcId);
    if (!src) return;
    let srcY = src.y;
    for (const tgt of targets) {
      if (!tgt || tgt.value === 0) continue;
      const linkH = Math.max(tgt.value * unit, 8);
      links.push({
        x0: src.x + nodeW,
        x1: tgt.x,
        y0a: srcY,
        y0b: srcY + linkH,
        y1a: tgt.y,
        y1b: tgt.y + tgt.h,
        color: tgt.color,
      });
      srcY += linkH;
    }
  }

  buildLinks(col0, 'applied', [
    col1.find((n) => n.id === 'pending'),
    col1.find((n) => n.id === 'noAnswer'),
    col1.find((n) => n.id === 'screening'),
    col1.find((n) => n.id === 'interview'),
    col1.find((n) => n.id === 'offers'),
    col1.find((n) => n.id === 'closed'),
  ]);

  function linkPath(l) {
    const xMid = (l.x0 + l.x1) / 2;
    return `
      M ${l.x0},${l.y0a}
      C ${xMid},${l.y0a} ${xMid},${l.y1a} ${l.x1},${l.y1a}
      L ${l.x1},${l.y1b}
      C ${xMid},${l.y1b} ${xMid},${l.y0b} ${l.x0},${l.y0b}
      Z
    `;
  }

  function renderNode(n, side, key) {
    const labelX = side === 'left' ? n.x - 12 : n.x + nodeW + 12;
    const anchor = side === 'left' ? 'end' : 'start';
    const numY = n.y + Math.max(n.h, 20) / 2 - 3;
    const textY = numY + 18;
    return (
      <g className="sankey-node" key={key}>
        <rect x={n.x} y={n.y} width={nodeW} height={Math.max(n.h, 6)} fill={n.color} rx="2" />
        <text x={labelX} y={numY} textAnchor={anchor} className="sankey-label-num" fill={n.textColor}>
          {n.value}
        </text>
        <text x={labelX} y={textY} textAnchor={anchor} className="sankey-label-text" fill={n.textColor}>
          {n.label}
        </text>
      </g>
    );
  }

  return (
    <div className="sankey-card">
      <div className="card-head">
        <div>
          <div className="card-title">Where applications go</div>
          <div className="card-sub">Current pipeline distribution.</div>
        </div>
        <div className="tag">{conv}</div>
      </div>
      <div className="sankey-container">
        <svg id="sankey-svg" viewBox="0 0 1100 440" preserveAspectRatio="xMidYMid meet">
          {links.map((l, i) => (
            <path key={`l${i}`} className="sankey-link" d={linkPath(l)} fill={l.color} />
          ))}
          {col0.map((n, i) => renderNode(n, 'left', `c0${i}`))}
          {col1.map((n, i) => renderNode(n, 'right', `c1${i}`))}
        </svg>
      </div>
    </div>
  );
}
