const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

export const IconLock = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" {...base}>
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);

export const IconArrowRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" {...base} strokeWidth={2.2}>
    <path d="M5 12h14" />
    <path d="M13 6l6 6-6 6" />
  </svg>
);

export const IconArrowLeft = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" {...base} strokeWidth={2.2}>
    <path d="M19 12H5" />
    <path d="M11 6l-6 6 6 6" />
  </svg>
);
