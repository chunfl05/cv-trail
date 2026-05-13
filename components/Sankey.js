'use client';

import { daysSince } from '@/lib/helpers';

/**
 * Multi-stage Sankey flow:
 *  Applications → (Interviews | Rejected | Pending | No Answer)
 *    Interviews → (Second Round | Rejected)
 *      Second Round → (Third Round | Rejected)
 *        Third Round → (Offers | Rejected)
 *
 * All the geometry logic is pulled verbatim from the original single-file app.
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

  // === Compute flow values ===
  const interviews = apps.filter((a) =>
    ['screening', 'interview', 'offer'].includes(a.status)
  ).length;
  const rejectedEarly = apps.filter((a) => a.status === 'rejected').length;
  const noAnswer = apps.filter(
    (a) => a.status === 'ghosted' || (a.status === 'applied' && daysSince(a.date) > 30)
  ).length;
  const stillPending = apps.filter(
    (a) => a.status === 'applied' && daysSince(a.date) <= 30
  ).length;

  const secondRound = apps.filter((a) => ['interview', 'offer'].includes(a.status)).length;
  const interviewRejected = interviews - secondRound;

  const thirdRound = apps.filter((a) => a.status === 'offer').length;
  const secondRoundRejected = secondRound - thirdRound;

  const offers = apps.filter((a) => a.status === 'offer').length;
  const thirdRoundRejected = thirdRound - offers;

  const conv = ((offers / total) * 100).toFixed(1) + '% offer rate';

  // === Layout ===
  const W = 1100,
    H = 440;
  const padding = { top: 30, right: 150, bottom: 30, left: 130 };
  const nodeW = 14;
  const usableH = H - padding.top - padding.bottom;
  const unit = (usableH - 40) / Math.max(total, 1);

  const cols = [
    padding.left,
    padding.left + (W - padding.left - padding.right) * 0.22,
    padding.left + (W - padding.left - padding.right) * 0.48,
    padding.left + (W - padding.left - padding.right) * 0.72,
    W - padding.right,
  ];

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
    [{ id: 'applied', label: 'Applications', value: total, color: 'var(--sk-applied)', textColor: '#7a766e' }],
    cols[0]
  );

  const col1 = makeNodes(
    [
      { id: 'interviews', label: 'Interviews', value: interviews, color: 'var(--sk-interview)', textColor: '#4a6b88' },
      { id: 'rejectedEarly', label: 'Rejected', value: rejectedEarly, color: 'var(--sk-rejected)', textColor: '#a26528' },
      { id: 'pending', label: 'Pending', value: stillPending, color: 'var(--sk-applied)', textColor: '#7a766e' },
      { id: 'noAnswer', label: 'No Answer', value: noAnswer, color: 'var(--sk-noanswer)', textColor: '#a05a4f' },
    ],
    cols[1]
  );

  const col2 = makeNodes(
    [
      { id: 'secondRound', label: 'Second Round', value: secondRound, color: 'var(--sk-second)', textColor: '#4a6b88' },
      { id: 'interviewRej', label: 'Rejected', value: interviewRejected, color: 'var(--sk-rejected)', textColor: '#a26528' },
    ],
    cols[2]
  );

  const col3 = makeNodes(
    [
      { id: 'thirdRound', label: 'Third Round', value: thirdRound, color: 'var(--sk-third)', textColor: '#4a6b88' },
      { id: 'secondRej', label: 'Rejected', value: secondRoundRejected, color: 'var(--sk-rejected)', textColor: '#a26528' },
    ],
    cols[3]
  );

  const col4 = makeNodes(
    [
      { id: 'offers', label: 'Offers', value: offers, color: 'var(--sk-offer)', textColor: '#4a6240' },
      { id: 'thirdRej', label: 'Rejected', value: thirdRoundRejected, color: 'var(--sk-rejected)', textColor: '#a26528' },
    ],
    cols[4]
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
    col1.find((n) => n.id === 'interviews'),
    col1.find((n) => n.id === 'rejectedEarly'),
    col1.find((n) => n.id === 'pending'),
    col1.find((n) => n.id === 'noAnswer'),
  ]);
  buildLinks(col1, 'interviews', [
    col2.find((n) => n.id === 'secondRound'),
    col2.find((n) => n.id === 'interviewRej'),
  ]);
  buildLinks(col2, 'secondRound', [
    col3.find((n) => n.id === 'thirdRound'),
    col3.find((n) => n.id === 'secondRej'),
  ]);
  buildLinks(col3, 'thirdRound', [
    col4.find((n) => n.id === 'offers'),
    col4.find((n) => n.id === 'thirdRej'),
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
          <div className="card-sub">From submission to outcome — visualized as flow.</div>
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
          {col2.map((n, i) => renderNode(n, 'right', `c2${i}`))}
          {col3.map((n, i) => renderNode(n, 'right', `c3${i}`))}
          {col4.map((n, i) => renderNode(n, 'right', `c4${i}`))}
        </svg>
      </div>
    </div>
  );
}
