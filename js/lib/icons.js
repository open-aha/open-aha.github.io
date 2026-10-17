// Inline stroke icons (24px grid, 2px stroke)
const wrap = (p, extra = '') =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${p}</svg>`;

export const icons = {
  x: wrap('<path d="M6 6l12 12M18 6L6 18"/>'),
  check: wrap('<path d="M5 12.5l4.5 4.5L19 7.5"/>', 'stroke-width="3"'),
  cross: wrap('<path d="M7 7l10 10M17 7L7 17"/>', 'stroke-width="3"'),
  left: wrap('<path d="M15 5l-7 7 7 7"/>'),
  right: wrap('<path d="M9 5l7 7-7 7"/>'),
  up: wrap('<path d="M6 15l6-6 6 6"/>'),
  down: wrap('<path d="M6 9l6 6 6-6"/>'),
  flame: wrap('<path d="M12 22c4.4 0 7-2.9 7-6.6 0-3.1-1.7-5.4-3.6-7.4-.4 1.6-1.3 2.8-2.6 3.4.3-3.3-1-6.4-3.8-8.4.1 2.9-1.4 4.8-3 6.6C4.6 11.2 5 12.9 5 15.4 5 19.1 7.6 22 12 22z" fill="currentColor" stroke="none"/>'),
  bolt: wrap('<path d="M13 2L4.5 13.5H11L10 22l8.5-11.5H12L13 2z" fill="currentColor" stroke="none"/>'),
  sun: wrap('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
  moon: wrap('<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>'),
  book: wrap('<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5v-16z"/><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>'),
  clock: wrap('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  layers: wrap('<path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5"/>'),
  grip: wrap('<circle cx="9" cy="6" r="1.3" fill="currentColor"/><circle cx="15" cy="6" r="1.3" fill="currentColor"/><circle cx="9" cy="12" r="1.3" fill="currentColor"/><circle cx="15" cy="12" r="1.3" fill="currentColor"/><circle cx="9" cy="18" r="1.3" fill="currentColor"/><circle cx="15" cy="18" r="1.3" fill="currentColor"/>', 'stroke="none"'),
  bulb: wrap('<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.4 1.1 2.2h5c0-.8.4-1.6 1.1-2.2A6 6 0 0 0 12 3z"/>'),
  play: wrap('<path d="M7 4.5v15l12-7.5-12-7.5z" fill="currentColor"/>'),
  pause: wrap('<path d="M7 4h3.5v16H7zM13.5 4H17v16h-3.5z" fill="currentColor" stroke="none"/>'),
  reset: wrap('<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/>'),
  star: wrap('<path d="M12 2.8l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9L12 2.8z" fill="currentColor" stroke="none"/>'),
  target: wrap('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/>'),
  pencil: wrap('<path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/>'),
  hand: wrap('<path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V12M11 11.5V4a1.5 1.5 0 0 1 3 0v8M14 11V5.5a1.5 1.5 0 0 1 3 0V14c0 4-2.5 7-6.5 7-2.6 0-4.2-1.3-5.5-3.3L3.4 15a1.6 1.6 0 0 1 2.6-1.8L8 15.5"/>'),
  question: wrap('<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14"/><circle cx="12" cy="17.3" r=".6" fill="currentColor"/>'),
  sparkle: wrap('<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" fill="currentColor" stroke="none"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z" fill="currentColor" stroke="none"/>'),
  eye: wrap('<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
  trophy: wrap('<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4z"/><path d="M17 5h3v2a4 4 0 0 1-4 4M7 5H4v2a4 4 0 0 0 4 4"/>'),
  atom: wrap('<circle cx="12" cy="12" r="1.6" fill="currentColor"/><ellipse cx="12" cy="12" rx="10" ry="4"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)"/>'),
  flag: wrap('<path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/>'),
  sigma: wrap('<path d="M18 5H6l6 7-6 7h12"/>'),
};

export const logo = `<svg viewBox="0 0 32 32" aria-hidden="true">
  <rect x="2" y="2" width="28" height="28" rx="9" fill="var(--ink)"/>
  <circle cx="12" cy="20" r="5" fill="var(--blue)"/>
  <path d="M15 8 L24 8 L24 17 Z" fill="var(--coral)"/>
  <circle cx="21" cy="21" r="2.3" fill="var(--amber)"/>
</svg>`;
