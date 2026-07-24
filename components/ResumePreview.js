'use client';

// Pure client-side rendering of a resumeJson (name/contact/sections/skills)
// into styled HTML via regular JSX — no server-side HTML/PDF rendering or
// headless browser involved, so it renders identically and reliably in
// production.
export default function ResumePreview({ resume }) {
  if (!resume) return null;
  return (
    <div>
      <div style={{ textAlign: 'center', fontFamily: "'Source Serif 4', serif", fontWeight: 600, fontSize: 16 }}>
        {resume.name}
      </div>
      <div style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--ink-3)', marginBottom: 12 }}>
        {resume.contact}
      </div>
      {resume.sections?.map((section, si) => (
        <div key={si} style={{ marginBottom: 10 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              borderBottom: '1px solid var(--line-soft)',
              paddingBottom: 3,
              marginBottom: 6,
            }}
          >
            {section.title}
          </div>
          {section.entries?.map((entry, ei) => (
            <div key={ei} style={{ marginBottom: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <strong style={{ fontSize: 12.5 }}>{entry.heading}</strong>
                <span style={{ fontSize: 11, color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>
                  {entry.subheading}
                </span>
              </div>
              {entry.bullets?.length > 0 && (
                <ul style={{ margin: '3px 0 0', paddingLeft: 16, fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.5 }}>
                  {entry.bullets.map((b, bi) => (
                    <li key={bi}>{b}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      ))}
      {resume.skills?.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              borderBottom: '1px solid var(--line-soft)',
              paddingBottom: 3,
              marginBottom: 6,
            }}
          >
            Skills
          </div>
          {resume.skills.map((line, li) => (
            <div key={li} style={{ fontSize: 12, color: 'var(--ink-2)', marginBottom: 2 }}>
              {line}
            </div>
          ))}
        </div>
      )}
      {resume.additional?.length > 0 && (
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              borderBottom: '1px solid var(--line-soft)',
              paddingBottom: 3,
              marginBottom: 6,
            }}
          >
            Additional
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-2)' }}>{resume.additional.join(' · ')}</div>
        </div>
      )}
    </div>
  );
}
