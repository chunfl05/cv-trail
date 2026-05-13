// Centralized SVG icons. All paths/strokes copied 1:1 from the original markup.

const ICONS = {
  dashboard: (
    <>
      <rect x="3" y="3" width="6" height="6" rx="1" />
      <rect x="11" y="3" width="6" height="6" rx="1" />
      <rect x="3" y="11" width="6" height="6" rx="1" />
      <rect x="11" y="11" width="6" height="6" rx="1" />
    </>
  ),
  applications: (
    <>
      <rect x="3" y="3" width="14" height="14" rx="1.5" />
      <path d="M3 7h14M3 11h14M3 15h14" />
    </>
  ),
  resumes: (
    <>
      <path d="M5 2h7l4 4v12H5z" />
      <path d="M12 2v4h4" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="4" width="14" height="13" rx="1.5" />
      <path d="M3 8h14M7 2v4M13 2v4" />
    </>
  ),
  insights: (
    <>
      <circle cx="10" cy="10" r="7" />
      <path d="M10 5v5l3 2" />
    </>
  ),
  plus: <path d="M8 3v10M3 8h10" />,
  close: <path d="M4 4l8 8M12 4l-8 8" />,
  trash: <path d="M3 4h10M6 4V2.5h4V4M5 4l.5 9h5l.5-9" />,
  edit: <path d="M11 2.5l2.5 2.5L6 12.5 3 13l.5-3z" />,
  tableEmpty: (
    <>
      <rect x="3" y="3" width="14" height="14" rx="1.5" />
      <path d="M3 7h14M3 11h14" />
    </>
  ),
};

export default function Icon({ name, size = 16, strokeWidth = 1.6, className, style }) {
  const path = ICONS[name];
  if (!path) return null;
  return (
    <svg
      viewBox={name === 'plus' || name === 'close' || name === 'trash' || name === 'edit' ? '0 0 16 16' : '0 0 20 20'}
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      className={className}
      style={style}
      aria-hidden="true"
    >
      {path}
    </svg>
  );
}
