// Course covers and decorative illustrations (SVG strings, theme-aware via CSS vars).

const frame = (body, bg = 'var(--cc-soft)') =>
  `<svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="320" height="200" fill="${bg}"/>${body}</svg>`;

const gridLines = (step = 20, op = 0.5) => {
  let d = '';
  for (let x = step; x < 320; x += step) d += `M${x} 0V200`;
  for (let y = step; y < 200; y += step) d += `M0 ${y}H320`;
  return `<path d="${d}" stroke="var(--grid)" stroke-width="1" opacity="${op * 2}"/>`;
};

export const covers = {
  balance: frame(`
    ${gridLines()}
    <path d="M160 60 L132 168 L188 168 Z" fill="var(--ink)" opacity=".18"/>
    <g transform="rotate(-6 160 64)">
      <rect x="58" y="58" width="204" height="10" rx="5" fill="var(--ink)"/>
      <path d="M70 64 L44 128 M70 64 L96 128 M250 64 L224 128 M250 64 L276 128" stroke="var(--ink)" stroke-opacity=".4" stroke-width="2"/>
    </g>
    <path d="M40 133 L100 133 L92 141 L48 141 Z" fill="var(--ink)" transform="translate(0,-8)"/>
    <path d="M220 133 L280 133 L272 141 L228 141 Z" fill="var(--ink)" transform="translate(0,16)"/>
    <rect x="50" y="98" width="26" height="26" rx="6" fill="var(--blue)"/>
    <text x="63" y="117" text-anchor="middle" font-family="Newsreader, serif" font-style="italic" font-size="18" fill="#fff">x</text>
    <circle cx="88" cy="115" r="9" fill="var(--amber)"/>
    <circle cx="232" cy="140" r="9" fill="var(--amber)"/><circle cx="252" cy="140" r="9" fill="var(--amber)"/><circle cx="272" cy="140" r="9" fill="var(--amber)"/>
    <circle cx="242" cy="122" r="9" fill="var(--amber)"/><circle cx="262" cy="122" r="9" fill="var(--amber)"/>
    <circle cx="160" cy="64" r="6" fill="var(--card)" stroke="var(--ink)" stroke-width="3"/>
  `),
  motion: frame(`
    ${gridLines()}
    <path d="M20 170 C 90 170, 140 150, 300 30" fill="none" stroke="var(--coral)" stroke-width="5" stroke-linecap="round"/>
    <path d="M20 170 L300 170 M20 170 L20 20" stroke="var(--ink)" stroke-opacity=".5" stroke-width="2"/>
    <g transform="translate(196 92) rotate(-28)">
      <rect x="-26" y="-14" width="52" height="22" rx="6" fill="var(--ink)"/>
      <rect x="-14" y="-24" width="28" height="12" rx="4" fill="var(--ink)"/>
      <circle cx="-14" cy="9" r="7" fill="var(--card)" stroke="var(--ink)" stroke-width="3"/>
      <circle cx="14" cy="9" r="7" fill="var(--card)" stroke="var(--ink)" stroke-width="3"/>
    </g>
    <path d="M240 120 L282 120" stroke="var(--blue)" stroke-width="5" stroke-linecap="round"/>
    <path d="M282 120 l-10 -7 v14 z" fill="var(--blue)"/>
    <circle cx="60" cy="166" r="5" fill="var(--coral)"/><circle cx="110" cy="158" r="5" fill="var(--coral)"/><circle cx="160" cy="136" r="5" fill="var(--coral)"/>
  `),
  functions: frame(`
    ${gridLines()}
    <path d="M0 100 H320 M160 0 V200" stroke="var(--ink)" stroke-opacity=".45" stroke-width="2"/>
    <path d="M30 190 L290 20" stroke="var(--blue)" stroke-width="5" stroke-linecap="round"/>
    <path d="M70 10 Q160 250 250 10" fill="none" stroke="var(--violet)" stroke-width="5" stroke-linecap="round"/>
    <circle cx="160" cy="128" r="8" fill="var(--violet)" stroke="var(--card)" stroke-width="3"/>
    <circle cx="214" cy="65" r="8" fill="var(--blue)" stroke="var(--card)" stroke-width="3"/>
  `),
  forces: frame(`
    ${gridLines()}
    <path d="M20 170 L300 80 L300 170 Z" fill="var(--ink)" opacity=".12"/>
    <path d="M20 170 L300 80" stroke="var(--ink)" stroke-width="3"/>
    <g transform="translate(170 118) rotate(-17.8)">
      <rect x="-30" y="-44" width="60" height="44" rx="6" fill="var(--coral)"/>
    </g>
    <path d="M164 102 V170" stroke="var(--blue)" stroke-width="5" stroke-linecap="round"/><path d="M164 176 l-8 -12 h16 z" fill="var(--blue)"/>
    <path d="M164 102 L146 46" stroke="var(--teal)" stroke-width="5" stroke-linecap="round"/><path d="M144 40 l-3 14 l14 -5 z" fill="var(--teal)"/>
    <path d="M164 102 L110 120" stroke="var(--amber)" stroke-width="5" stroke-linecap="round"/><path d="M102 123 l13 -10 l2 14 z" fill="var(--amber)"/>
    <circle cx="164" cy="102" r="5" fill="var(--ink)"/>
  `),
  geometry: frame(`
    ${gridLines(16)}
    <path d="M82 72 H130 V120 H82 Z" fill="var(--blue)" opacity=".85"/>
    <path d="M130 120 H194 V184 H130 Z" fill="var(--coral)" opacity=".85"/>
    <path d="M194 120 L130 72 L178 8 L242 56 Z" fill="var(--teal)" opacity=".85"/>
    <path d="M130 120 L194 120 L130 72 Z" fill="var(--card)" stroke="var(--ink)" stroke-width="3" stroke-linejoin="round"/>
    <path d="M130 110 h10 v10" fill="none" stroke="var(--ink)" stroke-width="2"/>
  `),
  energy: frame(`
    ${gridLines()}
    <path d="M20 40 C 80 40, 100 170, 160 170 S 240 60, 300 60" fill="none" stroke="var(--ink)" stroke-width="5" stroke-linecap="round"/>
    <circle cx="48" cy="28" r="12" fill="var(--coral)"/>
    <rect x="200" y="120" width="14" height="50" rx="3" fill="var(--blue)"/>
    <rect x="220" y="90" width="14" height="80" rx="3" fill="var(--amber)"/>
    <rect x="240" y="150" width="14" height="20" rx="3" fill="var(--teal)"/>
    <path d="M150 120 l12 -22 l-4 16 h10 l-14 24 l4 -18 z" fill="var(--amber)"/>
  `),
  trig: frame(`
    ${gridLines()}
    <circle cx="90" cy="100" r="60" fill="none" stroke="var(--ink)" stroke-opacity=".5" stroke-width="3"/>
    <path d="M90 100 L132 58" stroke="var(--blue)" stroke-width="4"/>
    <path d="M132 58 V100" stroke="var(--coral)" stroke-width="4"/>
    <path d="M90 100 H132" stroke="var(--teal)" stroke-width="4"/>
    <circle cx="132" cy="58" r="7" fill="var(--blue)" stroke="var(--card)" stroke-width="3"/>
    <path d="M150 100 C 170 40, 190 40, 210 100 S 250 160, 270 100 S 300 40, 320 60" fill="none" stroke="var(--coral)" stroke-width="4" stroke-linecap="round"/>
    <path d="M132 58 H170" stroke="var(--coral)" stroke-dasharray="4 5" stroke-width="2"/>
  `),
  waves: frame(`
    ${gridLines()}
    <path d="M0 100 C 30 40, 50 40, 80 100 S 130 160, 160 100 S 210 40, 240 100 S 290 160, 320 100" fill="none" stroke="var(--coral)" stroke-width="5"/>
    <path d="M0 100 C 20 70, 33 70, 53 100 S 87 130, 107 100 S 140 70, 160 100 S 193 130, 213 100 S 247 70, 267 100 S 300 130, 320 100" fill="none" stroke="var(--blue)" stroke-width="3" opacity=".8"/>
    <circle cx="60" cy="40" r="10" fill="var(--amber)"/>
    <path d="M60 0 V30" stroke="var(--ink)" stroke-width="2"/>
  `),
  calculus: frame(`
    ${gridLines()}
    <path d="M20 180 H300 M20 180 V20" stroke="var(--ink)" stroke-opacity=".45" stroke-width="2"/>
    ${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => { const x = 40 + i * 30; const y = 180 - (20 + 0.02 * (x - 20) ** 1.6); return `<rect x="${x}" y="${y}" width="28" height="${180 - y}" fill="var(--blue)" opacity=".28" rx="2"/>`; }).join('')}
    <path d="M20 160 ${Array.from({ length: 29 }, (_, i) => { const x = 20 + i * 10; return `L${x} ${180 - (20 + 0.02 * (x - 20) ** 1.6)}`; }).join(' ')}" fill="none" stroke="var(--blue)" stroke-width="5" stroke-linecap="round"/>
    <path d="M150 170 L290 40" stroke="var(--coral)" stroke-width="4" stroke-linecap="round"/>
    <circle cx="222" cy="103" r="8" fill="var(--coral)" stroke="var(--card)" stroke-width="3"/>
  `),
  integrals: frame(`
    ${gridLines()}
    <path d="M20 180 H300 M20 180 V20" stroke="var(--ink)" stroke-opacity=".45" stroke-width="2"/>
    <path d="M60 180 ${Array.from({ length: 41 }, (_, i) => { const x = 60 + i * 5; return `L${x} ${180 - (40 + 90 * Math.sin(((x - 20) / 280) * Math.PI))}`; }).join(' ')} L260 180 Z" fill="var(--violet)" opacity=".28"/>
    <path d="M20 140 ${Array.from({ length: 57 }, (_, i) => { const x = 20 + i * 5; return `L${x} ${180 - (40 + 90 * Math.sin(((x - 20) / 280) * Math.PI))}`; }).join(' ')}" fill="none" stroke="var(--violet)" stroke-width="5" stroke-linecap="round"/>
    <text x="160" y="160" text-anchor="middle" font-family="Newsreader, serif" font-style="italic" font-size="46" fill="var(--ink)">∫</text>
  `),
  momentum: frame(`
    ${gridLines()}
    <rect x="10" y="168" width="300" height="5" rx="2" fill="var(--ink)" opacity=".8"/>
    <rect x="60" y="120" width="90" height="40" rx="8" fill="var(--blue)"/><circle cx="78" cy="164" r="7" fill="var(--ink)"/><circle cx="132" cy="164" r="7" fill="var(--ink)"/>
    <rect x="170" y="128" width="64" height="32" rx="8" fill="var(--coral)"/><circle cx="184" cy="164" r="7" fill="var(--ink)"/><circle cx="220" cy="164" r="7" fill="var(--ink)"/>
    <path d="M80 100 h50 l-10 -7 v14 z" fill="var(--blue)"/><path d="M180 108 h70 l-10 -7 v14 z" fill="var(--coral)"/>
    <path d="M160 118 l-6 -14 m6 14 l6 -16 m-6 16 l12 -8" stroke="var(--amber)" stroke-width="4" stroke-linecap="round"/>
  `),
  light: frame(`
    <rect width="320" height="200" fill="var(--night)"/>
    <path d="M120 170 L170 40 L220 170 Z" fill="#fff" opacity=".18" stroke="#fff" stroke-opacity=".6" stroke-width="2"/>
    <path d="M10 120 L148 98" stroke="#fff" stroke-width="5"/>
    ${['#e53935', '#fb8c00', '#fdd835', '#43a047', '#1e88e5', '#7e57c2'].map((c, i) => `<path d="M148 98 L196 ${102 + i * 3} L320 ${118 + i * 13}" fill="none" stroke="${c}" stroke-width="4"/>`).join('')}
  `, 'var(--night)'),
  numbers: frame(`
    ${(() => {
      const isP = (n) => n > 1 && [...Array(Math.floor(Math.sqrt(n)) + 1).keys()].slice(2).every((d) => n % d);
      let out = '';
      for (let i = 0; i < 40; i++) {
        const n = i + 1, x = 20 + (i % 10) * 29, y = 22 + Math.floor(i / 10) * 40;
        out += `<rect x="${x}" y="${y}" width="24" height="32" rx="6" fill="${isP(n) ? 'var(--amber)' : 'var(--card)'}" opacity="${isP(n) ? 1 : 0.7}"/>`;
        out += `<text x="${x + 12}" y="${y + 21}" text-anchor="middle" font-size="12" font-weight="700" fill="var(--ink)" opacity="${isP(n) ? 1 : 0.45}">${n}</text>`;
      }
      return out;
    })()}
  `),
  series: frame(`
    ${gridLines()}
    ${(() => { let x = 20, w = 140, out = ''; const cols = ['var(--blue)', 'var(--coral)', 'var(--teal)', 'var(--amber)', 'var(--violet)', 'var(--pink)', 'var(--blue)']; for (let i = 0; i < 7; i++) { out += `<rect x="${x}" y="40" width="${w - Math.min(3, w / 3)}" height="120" rx="6" fill="${cols[i]}" opacity="${0.9 - i * 0.08}"/>`; x += w; w /= 2; } return out; })()}
    <path d="M300 30 V170" stroke="var(--ink)" stroke-width="3" stroke-dasharray="6 6"/>
    <text x="160" y="190" text-anchor="middle" font-family="Newsreader, serif" font-style="italic" font-size="18" fill="var(--ink)">½ + ¼ + ⅛ + … = 1</text>
  `),
  relativity: frame(`
    <rect width="320" height="200" fill="var(--night)"/>
    ${Array.from({ length: 24 }, (_, i) => `<circle cx="${(i * 89) % 320}" cy="${(i * 47) % 200}" r="1.2" fill="#fff" opacity=".5"/>`).join('')}
    <path d="M30 150 L90 50 L150 150 L210 50 L270 150" fill="none" stroke="var(--amber)" stroke-width="4" stroke-dasharray="7 6"/>
    ${[30, 90, 150, 210, 270].map((x, i) => `<rect x="${x - 22}" y="${i % 2 ? 40 : 152}" width="44" height="6" rx="2" fill="#fff" opacity=".8"/>`).join('')}
    <circle cx="270" cy="150" r="8" fill="var(--amber)"/>
    <text x="160" y="30" text-anchor="middle" font-family="Newsreader, serif" font-style="italic" font-size="22" fill="#fff">E = mc²</text>
  `, 'var(--night)'),
  statistics: frame(`
    ${gridLines()}
    <path d="M20 170 ${Array.from({ length: 57 }, (_, i) => { const x = 20 + i * 5; const z = (x - 160) / 45; return `L${x} ${170 - 140 * Math.exp(-z * z / 2)}`; }).join(' ')}" fill="var(--violet)" fill-opacity=".22" stroke="var(--violet)" stroke-width="4"/>
    <path d="M160 26 V170" stroke="var(--ink)" stroke-width="2" stroke-dasharray="5 5"/>
    ${[60, 85, 110, 135, 185, 210, 235, 260].map((x, i) => `<circle cx="${x}" cy="${182}" r="5" fill="var(--blue)" opacity="${0.4 + (i % 3) * 0.2}"/>`).join('')}
  `),
  magnetism: frame(`
    ${gridLines()}
    ${[30, 55, 80].map((rr) => `<ellipse cx="160" cy="100" rx="${rr + 70}" ry="${rr}" fill="none" stroke="var(--violet)" stroke-width="2" opacity=".55"/>`).join('')}
    <rect x="100" y="84" width="60" height="32" rx="5" fill="var(--blue)"/><rect x="160" y="84" width="60" height="32" rx="5" fill="var(--coral)"/>
    <text x="130" y="106" text-anchor="middle" font-weight="800" font-size="16" fill="#fff">S</text><text x="190" y="106" text-anchor="middle" font-weight="800" font-size="16" fill="#fff">N</text>
  `),
  complex: frame(`
    ${gridLines()}
    <path d="M40 100 H280 M160 10 V190" stroke="var(--ink)" stroke-opacity=".45" stroke-width="2"/>
    <circle cx="160" cy="100" r="70" fill="none" stroke="var(--ink-3)" stroke-width="2"/>
    ${Array.from({ length: 6 }, (_, k) => { const a = (2 * Math.PI * k) / 6; return `<circle cx="${160 + 70 * Math.cos(a)}" cy="${100 - 70 * Math.sin(a)}" r="7" fill="var(--teal)"/>`; }).join('')}
    <path d="M160 100 L${160 + 70 * Math.cos(1)} ${100 - 70 * Math.sin(1)}" stroke="var(--violet)" stroke-width="5" stroke-linecap="round"/>
    <text x="250" y="40" font-family="Newsreader, serif" font-style="italic" font-size="30" fill="var(--ink)">i</text>
  `),
  quantum: frame(`
    <rect width="320" height="200" fill="var(--night)"/>
    <rect x="96" y="14" width="8" height="70" fill="#fff" opacity=".85"/><rect x="96" y="94" width="8" height="12" fill="#fff" opacity=".85"/><rect x="96" y="116" width="8" height="70" fill="#fff" opacity=".85"/>
    ${Array.from({ length: 6 }, (_, k) => { const rr = 22 + k * 24; return `<path d="M104 ${89 - rr} A ${rr} ${rr} 0 0 1 104 ${89 + rr}" fill="none" stroke="var(--blue)" stroke-width="2" opacity="${0.6 - k * 0.07}"/><path d="M104 ${111 - rr} A ${rr} ${rr} 0 0 1 104 ${111 + rr}" fill="none" stroke="var(--blue)" stroke-width="2" opacity="${0.6 - k * 0.07}"/>`; }).join('')}
    ${Array.from({ length: 220 }, (_, i) => { const y = (((i * 37) % 220) / 220) * 2 - 1; const keep = Math.cos(9 * y) ** 2 * Math.exp((-y * y) / 0.45) > ((i * 53) % 100) / 100; return keep ? `<circle cx="${262 + ((i * 17) % 34)}" cy="${100 + y * 82}" r="2" fill="var(--amber)"/>` : ''; }).join('')}
  `, 'var(--night)'),
  logic: frame(`
    ${gridLines()}
    ${['E', 'K', '4', '7'].map((c, i) => `<rect x="${32 + i * 66}" y="${50 + (i % 2) * 14}" width="52" height="72" rx="8" fill="var(--card)" stroke="var(--ink)" stroke-width="2.5" transform="rotate(${(i - 1.5) * 5} ${58 + i * 66} ${86 + (i % 2) * 14})"/><text x="${58 + i * 66}" y="${98 + (i % 2) * 14}" text-anchor="middle" font-size="30" font-weight="800" fill="${i === 0 || i === 3 ? 'var(--coral)' : 'var(--ink)'}">${c}</text>`).join('')}
    <text x="160" y="170" text-anchor="middle" font-family="Newsreader, serif" font-style="italic" font-size="20" fill="var(--ink)">P ⇒ Q</text>
  `),
  fluids: frame(`
    <rect x="0" y="90" width="320" height="110" fill="var(--blue)" opacity=".28"/>
    <path d="M0 90 Q 40 80 80 90 T 160 90 T 240 90 T 320 90" fill="none" stroke="var(--blue)" stroke-width="3"/>
    <path d="M90 60 L230 60 L210 110 L110 110 Z" fill="var(--coral)"/>
    <rect x="150" y="28" width="6" height="34" fill="var(--ink)"/><path d="M156 30 L184 42 L156 52 Z" fill="var(--amber)"/>
    <path d="M60 170 l0 -18 m-6 6 l6 -6 l6 6" stroke="var(--ink)" stroke-width="3" fill="none"/>
    <path d="M260 170 l0 -18 m-6 6 l6 -6 l6 6" stroke="var(--ink)" stroke-width="3" fill="none"/>
  `),
  counting: frame(`
    ${gridLines()}
    ${(() => { const C = (n, k) => { let x = 1; for (let i = 1; i <= k; i++) x = (x * (n - k + i)) / i; return Math.round(x); }; let out = ''; for (let n = 0; n <= 5; n++) for (let k = 0; k <= n; k++) { const x = 160 + (k - n / 2) * 40, y = 26 + n * 30; out += `<circle cx="${x}" cy="${y}" r="13" fill="${n === 5 ? 'var(--violet)' : 'var(--card)'}" stroke="var(--ink)" stroke-opacity=".3"/><text x="${x}" y="${y + 4}" text-anchor="middle" font-size="11" font-weight="800" fill="${n === 5 ? '#fff' : 'var(--ink)'}">${C(n, k)}</text>`; } return out; })()}
  `),
  rotation: frame(`
    ${gridLines()}
    <path d="M160 140 L140 175 L180 175 Z" fill="var(--ink)" opacity=".35"/>
    <g transform="rotate(-8 160 140)"><rect x="40" y="134" width="240" height="10" rx="5" fill="var(--ink)"/>
    <rect x="58" y="104" width="30" height="30" rx="5" fill="var(--blue)"/><rect x="228" y="112" width="22" height="22" rx="5" fill="var(--coral)"/></g>
    <circle cx="160" cy="58" r="30" fill="none" stroke="var(--violet)" stroke-width="5" stroke-dasharray="120 70"/>
    <path d="M186 40 l8 12 l-14 1 z" fill="var(--violet)"/>
  `),
  graphs: frame(`
    ${gridLines()}
    ${(() => { const P = [[60, 100], [130, 40], [130, 160], [220, 50], [220, 150], [280, 100]]; const E = [[0, 1], [0, 2], [1, 2], [1, 3], [2, 4], [3, 4], [3, 5], [4, 5], [1, 4]]; const cols = ['var(--blue)', 'var(--coral)', 'var(--teal)', 'var(--blue)', 'var(--amber)', 'var(--coral)']; return E.map(([a, b]) => `<line x1="${P[a][0]}" y1="${P[a][1]}" x2="${P[b][0]}" y2="${P[b][1]}" stroke="var(--ink)" stroke-opacity=".5" stroke-width="3"/>`).join('') + P.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="14" fill="${cols[i]}" stroke="var(--card)" stroke-width="3"/>`).join(''); })()}
  `),
  astro: frame(`
    <rect width="320" height="200" fill="var(--night)"/>
    ${Array.from({ length: 40 }, (_, i) => `<circle cx="${(i * 79) % 320}" cy="${(i * 43) % 200}" r="${i % 5 ? 1 : 1.8}" fill="#fff" opacity=".6"/>`).join('')}
    ${[0, 1, 2, 3, 4].map((k) => { const cx = 50 + k * 55, R = 18, phi = (k * Math.PI) / 4, rx = R * Math.abs(Math.cos(phi)); return `<circle cx="${cx}" cy="100" r="${R}" fill="#2b2a33" stroke="#fff" stroke-opacity=".2"/><path d="M${cx} ${100 - R} A${R} ${R} 0 0 1 ${cx} ${100 + R} A${rx} ${R} 0 0 ${k < 2 ? 0 : 1} ${cx} ${100 - R} Z" fill="#f3ecd2"/>`; }).join('')}
  `, 'var(--night)'),
  infinity: frame(`
    ${gridLines()}
    <path d="M160 100 C 120 40, 50 40, 50 100 C 50 160, 120 160, 160 100 C 200 40, 270 40, 270 100 C 270 160, 200 160, 160 100 Z" fill="none" stroke="var(--violet)" stroke-width="10" stroke-linejoin="round"/>
    ${Array.from({ length: 9 }, (_, i) => `<rect x="${20 + i * 32}" y="168" width="24" height="20" rx="3" fill="${i % 2 ? 'var(--amber)' : 'var(--card)'}" stroke="var(--ink)" stroke-opacity=".4"/>`).join('')}
  `),
  nuclear: frame(`
    ${gridLines()}
    ${[[150, 92, 1], [168, 100, 0], [158, 112, 1], [176, 116, 0], [142, 110, 0], [164, 84, 1], [180, 98, 1], [150, 126, 0], [170, 130, 1]].map(([x, y, p]) => `<circle cx="${x}" cy="${y}" r="13" fill="${p ? 'var(--coral)' : 'var(--blue)'}" stroke="var(--card)" stroke-width="2"/>`).join('')}
    <ellipse cx="160" cy="105" rx="120" ry="40" fill="none" stroke="var(--ink)" stroke-opacity=".35" stroke-width="2"/>
    <ellipse cx="160" cy="105" rx="120" ry="40" fill="none" stroke="var(--ink)" stroke-opacity=".35" stroke-width="2" transform="rotate(60 160 105)"/>
    <ellipse cx="160" cy="105" rx="120" ry="40" fill="none" stroke="var(--ink)" stroke-opacity=".35" stroke-width="2" transform="rotate(120 160 105)"/>
  `),
  electrostatics: frame(`
    ${gridLines()}
    ${Array.from({ length: 7 }, (_, k) => { const t = (k - 3) * 22; return `<path d="M110 100 C 140 ${100 + t * 1.6}, 180 ${100 + t * 1.6}, 210 100" fill="none" stroke="var(--violet)" stroke-width="2" opacity=".6"/>`; }).join('')}
    <circle cx="110" cy="100" r="22" fill="var(--coral)"/><text x="110" y="109" text-anchor="middle" font-size="26" font-weight="800" fill="#fff">+</text>
    <circle cx="210" cy="100" r="22" fill="var(--blue)"/><text x="210" y="109" text-anchor="middle" font-size="26" font-weight="800" fill="#fff">−</text>
  `),
  solids: frame(`
    ${gridLines()}
    <path d="M110 60 L170 40 L210 70 L150 92 Z" fill="var(--violet)" opacity=".35" stroke="var(--violet)" stroke-width="3" stroke-linejoin="round"/>
    <path d="M110 60 L110 140 L150 172 L150 92 Z" fill="var(--violet)" opacity=".55" stroke="var(--violet)" stroke-width="3" stroke-linejoin="round"/>
    <path d="M150 92 L150 172 L210 150 L210 70 Z" fill="var(--violet)" opacity=".75" stroke="var(--violet)" stroke-width="3" stroke-linejoin="round"/>
    <circle cx="255" cy="110" r="38" fill="var(--teal)" opacity=".8"/>
    <ellipse cx="255" cy="110" rx="38" ry="11" fill="none" stroke="var(--card)" stroke-width="2" opacity=".7"/>
    <path d="M40 160 L70 80 L100 160 Z" fill="var(--amber)"/>
  `),
  fractals: frame(`
    ${gridLines()}
    ${(() => { const out = []; const rec = (a, b, c, d) => { if (!d) { out.push(`<path d="M${a} L${b} L${c} Z" fill="var(--violet)" opacity=".85"/>`); return; } const m = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]; const ab = m(a, b), bc = m(b, c), ca = m(c, a); rec(a, ab, ca, d - 1); rec(ab, b, bc, d - 1); rec(ca, bc, c, d - 1); }; rec([70, 180], [250, 180], [160, 24], 5); return out.join(''); })()}
  `),
  games: frame(`
    ${gridLines()}
    <rect x="80" y="40" width="160" height="120" rx="10" fill="var(--card)" stroke="var(--ink)" stroke-width="3"/>
    <path d="M160 40 V160 M80 100 H240" stroke="var(--ink)" stroke-width="3"/>
    <rect x="86" y="46" width="68" height="48" rx="6" fill="var(--success)" opacity=".75"/>
    <rect x="166" y="106" width="68" height="48" rx="6" fill="var(--error)" opacity=".75"/>
    <text x="120" y="77" text-anchor="middle" font-weight="800" font-size="18" fill="#fff">3, 3</text>
    <text x="200" y="77" text-anchor="middle" font-weight="800" font-size="18" fill="var(--ink)">0, 5</text>
    <text x="120" y="137" text-anchor="middle" font-weight="800" font-size="18" fill="var(--ink)">5, 0</text>
    <text x="200" y="137" text-anchor="middle" font-weight="800" font-size="18" fill="#fff">1, 1</text>
  `),
  particles: frame(`
    ${gridLines()}
    <circle cx="160" cy="100" r="70" fill="var(--coral-soft)" stroke="var(--coral)" stroke-width="3"/>
    ${[[135, 80, 'u', 'var(--coral)'], [185, 80, 'u', 'var(--coral)'], [160, 128, 'd', 'var(--blue)']].map(([x, y, q, c]) => `<circle cx="${x}" cy="${y}" r="20" fill="${c}"/><text x="${x}" y="${y + 7}" text-anchor="middle" font-family="Newsreader, serif" font-style="italic" font-size="22" fill="#fff">${q}</text>`).join('')}
    <path d="M147 88 q 6 18 4 30 M173 88 q -6 18 -4 30 M152 80 q 8 -10 16 0" stroke="var(--teal)" stroke-width="3" fill="none" stroke-dasharray="3 3"/>
  `),
  ratios: frame(`
    ${gridLines()}
    <circle cx="100" cy="100" r="60" fill="var(--card)" stroke="var(--ink)" stroke-width="3"/>
    <path d="M100 100 L100 40 A60 60 0 0 1 157 119 Z" fill="var(--blue)"/>
    <text x="235" y="118" text-anchor="middle" font-family="Newsreader, serif" font-size="58" font-weight="600" fill="var(--coral)">%</text>
    ${[0, 1, 2, 3].map((i) => `<rect x="${190 + i * 22}" y="150" width="18" height="22" rx="3" fill="${i < 3 ? 'var(--teal)' : 'var(--card)'}" stroke="var(--ink)" stroke-opacity=".3"/>`).join('')}
  `),
  powers: frame(`
    ${gridLines()}
    <text x="80" y="120" text-anchor="middle" font-family="Newsreader, serif" font-size="64" font-weight="600" fill="var(--ink)">10</text>
    <text x="128" y="78" font-family="Newsreader, serif" font-style="italic" font-size="34" fill="var(--coral)">n</text>
    ${[0, 1, 2, 3, 4].map((i) => `<rect x="${170 + i * 26}" y="${150 - 6 * 2 ** i}" width="20" height="${6 * 2 ** i}" rx="3" fill="var(--blue)" opacity="${0.5 + i * 0.12}"/>`).join('')}
    <text x="236" y="182" text-anchor="middle" font-family="Newsreader, serif" font-size="22" fill="var(--ink)">√</text>
  `),
  machines: frame(`
    ${gridLines()}
    ${(() => { const g = (cx, cy, R, n, col) => { let d = ''; for (let i = 0; i <= n * 4; i++) { const a = (2 * Math.PI * i) / (n * 4); const rr = i % 4 < 2 ? R + 6 : R - 2; d += `${i ? 'L' : 'M'}${(cx + rr * Math.cos(a)).toFixed(1)} ${(cy + rr * Math.sin(a)).toFixed(1)}`; } return `<path d="${d}Z" fill="${col}"/><circle cx="${cx}" cy="${cy}" r="6" fill="var(--card)"/>`; }; return g(120, 100, 52, 16, 'var(--blue)') + g(204, 100, 30, 9, 'var(--coral)'); })()}
    <path d="M30 180 L290 180 L290 150 Z" fill="var(--ink)" opacity=".18"/>
  `),
  quadratics: frame(`
    ${gridLines()}
    <line x1="30" y1="140" x2="290" y2="140" stroke="var(--ink)" stroke-opacity=".35" stroke-width="3"/>
    <path d="${Array.from({ length: 41 }, (_, i) => { const x = 92 + i * 3.4; const u = (x - 160) / 55; return `${i ? 'L' : 'M'}${x.toFixed(1)} ${(140 - 90 + 90 * u * u * 0.95).toFixed(1)}`; }).join(' ')}" fill="none" stroke="var(--blue)" stroke-width="6" stroke-linecap="round"/>
    <circle cx="103.6" cy="140" r="9" fill="var(--coral)"/><circle cx="216.4" cy="140" r="9" fill="var(--coral)"/>
    <circle cx="160" cy="50" r="8" fill="var(--amber)"/>
  `),
  sound: frame(`
    ${gridLines()}
    <path d="M58 82 H84 L118 56 V144 L84 118 H58 Z" fill="var(--ink)" stroke="var(--ink)" stroke-width="4" stroke-linejoin="round"/>
    ${[0, 1, 2].map((i) => `<path d="M${140 + i * 30} ${70 - i * 18} q${22 + i * 8} ${30 + i * 18} 0 ${60 + i * 36}" fill="none" stroke="${['var(--blue)', 'var(--teal)', 'var(--coral)'][i]}" stroke-width="6" stroke-linecap="round"/>`).join('')}
    ${Array.from({ length: 14 }, (_, i) => `<circle cx="${226 + (i % 2) * 14 + Math.sin(i) * 4}" cy="${40 + i * 9}" r="3" fill="var(--ink)" opacity=".35"/>`).join('')}
  `),
  linalg: frame(`
    ${gridLines()}
    ${[-3, -2, -1, 0, 1, 2, 3].map((k) => { const T = (x, y) => [160 + 34 * (x + 0.5 * y), 110 - 34 * (0.3 * x + y)]; const a = T(k, -3), b = T(k, 3), c = T(-3, k), d = T(3, k); return `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="var(--violet)" stroke-opacity=".35" stroke-width="2"/><line x1="${c[0]}" y1="${c[1]}" x2="${d[0]}" y2="${d[1]}" stroke="var(--violet)" stroke-opacity=".35" stroke-width="2"/>`; }).join('')}
    <path d="M160 110 L194 99.8 L211 65.8 L177 76 Z" fill="var(--amber)" opacity=".55"/>
    <line x1="160" y1="110" x2="194" y2="99.8" stroke="var(--blue)" stroke-width="6" stroke-linecap="round"/>
    <line x1="160" y1="110" x2="177" y2="76" stroke="var(--coral)" stroke-width="6" stroke-linecap="round"/>
    <line x1="80" y1="190" x2="250" y2="20" stroke="var(--success)" stroke-width="4" stroke-dasharray="8 8" opacity=".6"/>
  `),
  diffeq: frame(`
    ${gridLines()}
    ${Array.from({ length: 9 }, (_, i) => Array.from({ length: 6 }, (_, j) => { const x = 40 + i * 30, y = 30 + j * 30; const X = (x - 160) / 60, Y = (110 - y) / 60; const m = X - Y; const dx = 9 / Math.sqrt(1 + m * m); return `<line x1="${(x - dx).toFixed(1)}" y1="${(y + m * dx).toFixed(1)}" x2="${(x + dx).toFixed(1)}" y2="${(y - m * dx).toFixed(1)}" stroke="var(--ink)" stroke-opacity=".35" stroke-width="3" stroke-linecap="round"/>`; }).join('')).join('')}
    <path d="${Array.from({ length: 41 }, (_, i) => { const X = -2 + i * 0.1; const Y = X - 1 + 3.5 * Math.exp(-(X + 2)); return `${i ? 'L' : 'M'}${(160 + X * 60).toFixed(1)} ${(110 - Y * 60).toFixed(1)}`; }).join(' ')}" fill="none" stroke="var(--blue)" stroke-width="6" stroke-linecap="round"/>
    <circle cx="40" cy="80" r="9" fill="var(--coral)"/>
  `),
  units: frame(`
    ${gridLines()}
    <rect x="40" y="120" width="240" height="44" rx="8" fill="var(--amber)"/>
    ${Array.from({ length: 23 }, (_, i) => `<line x1="${50 + i * 10}" y1="120" x2="${50 + i * 10}" y2="${i % 5 === 0 ? 146 : 134}" stroke="var(--ink)" stroke-width="2.5"/>`).join('')}
    <rect x="70" y="58" width="36" height="36" rx="4" fill="var(--blue)"/>
    <rect x="130" y="38" width="56" height="56" rx="5" fill="var(--teal)"/>
    <rect x="210" y="14" width="80" height="80" rx="6" fill="var(--coral)"/>
  `),
  binary: frame(`
    ${gridLines()}
    ${[1, 0, 1, 0, 1, 1].map((b, i) => `<rect x="${34 + i * 44}" y="70" width="36" height="52" rx="8" fill="${b ? 'var(--ink)' : 'var(--card)'}" stroke="var(--ink)" stroke-width="3"/><text x="${52 + i * 44}" y="105" text-anchor="middle" font-family="var(--font-mono)" font-size="26" font-weight="700" fill="${b ? 'var(--card)' : 'var(--ink)'}">${b}</text>`).join('')}
    <rect x="34" y="140" width="80" height="22" rx="6" fill="var(--coral)"/>
    <rect x="122" y="140" width="80" height="22" rx="6" fill="var(--teal)"/>
    <rect x="210" y="140" width="80" height="22" rx="6" fill="var(--blue)"/>
    <circle cx="160" cy="40" r="14" fill="var(--amber)"/>
  `),
  groups: frame(`
    ${gridLines()}
    <line x1="160" y1="16" x2="160" y2="186" stroke="var(--ink)" stroke-opacity=".35" stroke-width="3" stroke-dasharray="8 8"/>
    <path d="M160 36 L232 160 L88 160 Z" fill="var(--blue-soft)" stroke="var(--ink)" stroke-width="5" stroke-linejoin="round"/>
    <circle cx="160" cy="36" r="13" fill="var(--coral)"/><circle cx="232" cy="160" r="13" fill="var(--blue)"/><circle cx="88" cy="160" r="13" fill="var(--teal)"/>
    <path d="M250 70 a40 40 0 0 0 -40 -40" fill="none" stroke="var(--amber)" stroke-width="6" stroke-linecap="round"/>
    <path d="M204 22 l8 9 l-11 4 Z" fill="var(--amber)"/>
  `),
  circular: frame(`
    ${gridLines()}
    <circle cx="150" cy="100" r="66" fill="none" stroke="var(--ink)" stroke-opacity=".4" stroke-width="3" stroke-dasharray="8 8"/>
    <line x1="150" y1="100" x2="196.7" y2="53.3" stroke="var(--ink)" stroke-width="3"/>
    <circle cx="150" cy="100" r="6" fill="var(--ink)"/>
    <line x1="196.7" y1="53.3" x2="250" y2="106.6" stroke="var(--blue)" stroke-width="6" stroke-linecap="round"/>
    <path d="M262 118.6 L242 110 L254 98 Z" fill="var(--blue)"/>
    <line x1="196.7" y1="53.3" x2="172" y2="78" stroke="var(--coral)" stroke-width="6" stroke-linecap="round"/>
    <path d="M163 87 L168 70 L180 82 Z" fill="var(--coral)"/>
    <circle cx="196.7" cy="53.3" r="14" fill="var(--ink)"/>
  `),
  digital: frame(`
    ${gridLines()}
    <path d="M60 110 H118" stroke="var(--coral)" stroke-width="5"/><path d="M60 70 H90 V96 H118" fill="none" stroke="var(--coral)" stroke-width="5"/><path d="M60 150 H90 V124 H118" fill="none" stroke="var(--ink)" stroke-opacity=".4" stroke-width="5"/>
    <path d="M118 80 H150 A30 30 0 0 1 150 140 H118 Z" fill="var(--card)" stroke="var(--ink)" stroke-width="5" stroke-linejoin="round"/>
    <path d="M180 110 H236" stroke="var(--ink)" stroke-opacity=".4" stroke-width="5"/>
    <circle cx="258" cy="110" r="22" fill="var(--card)" stroke="var(--ink)" stroke-width="5"/>
    <circle cx="60" cy="70" r="9" fill="var(--coral)"/><circle cx="60" cy="150" r="9" fill="var(--ink)" opacity=".4"/>
  `),
  climate: frame(`
    ${gridLines()}
    <circle cx="70" cy="60" r="28" fill="var(--amber)"/>
    ${[0, 1, 2].map((i) => `<path d="M${100 + i * 10} ${70 + i * 8} L${150 + i * 10} ${110 + i * 8}" stroke="var(--amber)" stroke-width="4" stroke-linecap="round"/>`).join('')}
    <path d="M30 186 A160 70 0 0 1 290 186 Z" fill="var(--teal)" opacity=".85"/>
    <path d="M22 186 A168 92 0 0 1 298 186" fill="none" stroke="var(--blue)" stroke-width="3" stroke-dasharray="6 6" opacity=".7"/>
    <path d="M200 140 q8 -14 0 -26 q-8 -12 0 -26" fill="none" stroke="var(--coral)" stroke-width="4" stroke-linecap="round"/>
    <path d="M230 146 q8 -14 0 -26 q-8 -12 0 -26" fill="none" stroke="var(--coral)" stroke-width="4" stroke-linecap="round"/>
  `),
  fourier: frame(`
    ${gridLines()}
    <path d="M30 140 V60 H95 V140 H160 V60 H225 V140 H290" fill="none" stroke="var(--ink)" stroke-opacity=".35" stroke-width="3" stroke-dasharray="7 6"/>
    <path d="${Array.from({ length: 161 }, (_, i) => { const x = 30 + i * 1.625; const t = ((x - 30) / 130) * 2 * Math.PI; let y = 0; for (let k = 1; k <= 9; k += 2) y += Math.sin(k * t) / k; return `${i ? 'L' : 'M'}${x.toFixed(1)} ${(100 - 50 * (4 / Math.PI) * y).toFixed(1)}`; }).join(' ')}" fill="none" stroke="var(--violet)" stroke-width="5" stroke-linejoin="round"/>
    ${[1, 3, 5, 7].map((k, i) => `<rect x="${236 + i * 14}" y="${180 - 40 / k}" width="10" height="${40 / k}" rx="2" fill="var(--coral)"/>`).join('')}
  `),
  conics: frame(`
    ${gridLines()}
    <ellipse cx="110" cy="100" rx="70" ry="42" fill="none" stroke="var(--blue)" stroke-width="5"/>
    <circle cx="57" cy="100" r="5" fill="var(--blue)"/><circle cx="163" cy="100" r="5" fill="var(--blue)"/>
    <path d="${Array.from({ length: 41 }, (_, i) => { const x = -60 + i * 3; return `${i ? 'L' : 'M'}${(240 + x).toFixed(1)} ${(160 - (x * x) / 30).toFixed(1)}`; }).join(' ')}" fill="none" stroke="var(--coral)" stroke-width="5" stroke-linecap="round"/>
    <circle cx="240" cy="152.5" r="5" fill="var(--coral)"/>
    <line x1="180" y1="168" x2="300" y2="168" stroke="var(--teal)" stroke-width="3" stroke-dasharray="6 6"/>
  `),
  emwaves: frame(`
    ${gridLines()}
    <line x1="24" y1="110" x2="296" y2="110" stroke="var(--ink)" stroke-width="3"/>
    <path d="${Array.from({ length: 121 }, (_, i) => { const x = 30 + i * 2.2; return `${i ? 'L' : 'M'}${x.toFixed(1)} ${(110 - 52 * Math.sin((i / 120) * 4 * Math.PI)).toFixed(1)}`; }).join(' ')}" fill="none" stroke="var(--blue)" stroke-width="5"/>
    <path d="${Array.from({ length: 121 }, (_, i) => { const x = 30 + i * 2.2; const b = 40 * Math.sin((i / 120) * 4 * Math.PI); return `${i ? 'L' : 'M'}${(x - 0.55 * b).toFixed(1)} ${(110 + 0.5 * b).toFixed(1)}`; }).join(' ')}" fill="none" stroke="var(--coral)" stroke-width="4"/>
  `),
  taylor: frame(`
    ${gridLines()}
    <line x1="20" y1="100" x2="300" y2="100" stroke="var(--ink)" stroke-opacity=".35" stroke-width="3"/>
    <path d="${Array.from({ length: 141 }, (_, i) => { const x = 20 + i * 2; const t = (x - 160) / 30; return `${i ? 'L' : 'M'}${x} ${(100 - 50 * Math.sin(t)).toFixed(1)}`; }).join(' ')}" fill="none" stroke="var(--blue)" stroke-width="5"/>
    ${[1, 3, 5].map((n, j) => `<path d="${Array.from({ length: 141 }, (_, i) => { const x = 20 + i * 2; const t = (x - 160) / 30; let s = 0; for (let k = 0; 2 * k + 1 <= n; k++) { let f = 1; for (let q = 2; q <= 2 * k + 1; q++) f *= q; s += ((-1) ** k * t ** (2 * k + 1)) / f; } return `${i ? 'L' : 'M'}${x} ${Math.max(-20, Math.min(220, 100 - 50 * s)).toFixed(1)}`; }).join(' ')}" fill="none" stroke="var(--coral)" stroke-width="3" opacity="${0.35 + 0.3 * j}"/>`).join('')}
  `),
  semiconductors: frame(`
    ${gridLines()}
    <rect x="40" y="60" width="110" height="90" rx="8" fill="var(--coral)" opacity=".8"/>
    <rect x="150" y="60" width="110" height="90" rx="8" fill="var(--blue)" opacity=".8"/>
    <rect x="135" y="60" width="30" height="90" fill="var(--card)" opacity=".7"/>
    <text x="95" y="114" text-anchor="middle" font-family="var(--font-sans)" font-size="30" font-weight="800" fill="#fff">p</text>
    <text x="205" y="114" text-anchor="middle" font-family="var(--font-sans)" font-size="30" font-weight="800" fill="#fff">n</text>
    <circle cx="270" cy="40" r="16" fill="var(--success)"/><circle cx="270" cy="40" r="28" fill="var(--success)" opacity=".25"/>
  `),
  distributions: frame(`
    ${gridLines()}
    ${[0.03, 0.1, 0.2, 0.25, 0.2, 0.12, 0.06, 0.03, 0.01].map((q, k) => `<rect x="${44 + k * 28}" y="${172 - q * 520}" width="20" height="${q * 520}" rx="4" fill="${k === 3 ? 'var(--coral)' : 'var(--violet)'}"/>`).join('')}
    <line x1="36" y1="172" x2="292" y2="172" stroke="var(--ink)" stroke-width="3"/>
    <line x1="138" y1="22" x2="138" y2="172" stroke="var(--coral)" stroke-width="3" stroke-dasharray="6 6"/>
  `),
  puzzles: frame(`
    ${gridLines()}
    ${Array.from({ length: 16 }, (_, k) => { const i = Math.floor(k / 4), j = k % 4; const gone = (i === 0 && j === 0) || (i === 3 && j === 3); return gone ? '' : `<rect x="${40 + j * 32}" y="${36 + i * 32}" width="32" height="32" fill="${(i + j) % 2 ? 'var(--blue-soft)' : 'var(--ink)'}" opacity="${(i + j) % 2 ? 1 : 0.8}"/>`; }).join('')}
    <rect x="72" y="36" width="64" height="32" rx="6" fill="none" stroke="var(--coral)" stroke-width="4"/>
    <circle cx="232" cy="100" r="52" fill="var(--blue-soft)" stroke="var(--ink)" stroke-width="4"/>
    <path d="M232 48 L281 116 L200 141 Z M232 48 L200 141 M281 116 L232 48" fill="none" stroke="var(--violet)" stroke-width="3"/>
    <circle cx="232" cy="48" r="7" fill="var(--coral)"/><circle cx="281" cy="116" r="7" fill="var(--coral)"/><circle cx="200" cy="141" r="7" fill="var(--coral)"/>
  `),
  flight: frame(`
    ${gridLines()}
    ${[0, 1, 2, 3].map((i) => `<path d="M20 ${70 + i * 22} C 110 ${70 + i * 22}, 150 ${50 + i * 26}, 300 ${90 + i * 30}" fill="none" stroke="var(--blue)" stroke-opacity=".45" stroke-width="3"/>`).join('')}
    <path d="M90 120 C 120 92, 190 88, 236 108 C 200 114, 140 122, 90 120 Z" fill="var(--ink)" transform="rotate(-8 160 110)"/>
    <line x1="158" y1="100" x2="158" y2="34" stroke="var(--success)" stroke-width="6" stroke-linecap="round"/>
    <path d="M158 22 l-10 16 h20 Z" fill="var(--success)"/>
  `),
  limits: frame(`
    ${gridLines()}
    <line x1="30" y1="170" x2="295" y2="170" stroke="var(--ink)" stroke-opacity=".35" stroke-width="3"/>
    <rect x="30" y="72" width="265" height="40" fill="var(--success)" opacity=".18"/>
    <rect x="140" y="20" width="40" height="150" fill="var(--blue)" opacity=".14"/>
    <path d="M30 165 Q 110 150 152 98 M168 86 Q 210 40 295 30" fill="none" stroke="var(--violet)" stroke-width="5" stroke-linecap="round"/>
    <circle cx="160" cy="92" r="9" fill="var(--card)" stroke="var(--violet)" stroke-width="4"/>
  `),
  tilings: frame(`
    ${gridLines()}
    ${(() => { const out = []; const R = 22, w = R * Math.sqrt(3); for (let row = -1; row < 7; row++) for (let col = -1; col < 9; col++) { const cx = col * w + (row % 2 ? w / 2 : 0), cy = row * R * 1.5; const pts = Array.from({ length: 6 }, (_, k) => { const a = Math.PI / 6 + (k * Math.PI) / 3; return `${(cx + R * Math.cos(a)).toFixed(1)},${(cy + R * Math.sin(a)).toFixed(1)}`; }).join(' '); const c = ['var(--blue)', 'var(--teal)', 'var(--amber)'][((row % 3) + 3 + col) % 3]; out.push(`<polygon points="${pts}" fill="${c}" opacity=".75" stroke="var(--card)" stroke-width="3"/>`); } return out.join(''); })()}
  `),
  voting: frame(`
    ${gridLines()}
    <rect x="60" y="96" width="44" height="80" rx="6" fill="var(--blue)"/>
    <rect x="138" y="56" width="44" height="120" rx="6" fill="var(--coral)"/>
    <rect x="216" y="116" width="44" height="60" rx="6" fill="var(--teal)"/>
    <line x1="40" y1="176" x2="280" y2="176" stroke="var(--ink)" stroke-width="3"/>
    <path d="M150 30 l8 8 l16 -18" fill="none" stroke="var(--ink)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
  `),
  topology: frame(`
    ${gridLines()}
    ${(() => { const X = (t) => 160 + 26 * (Math.sin(t) + 2 * Math.sin(2 * t)), Y = (t) => 104 - 26 * (Math.cos(t) - 2 * Math.cos(2 * t)); const arcs = [[1.815, 3.91], [3.91, 6.004], [6.004, 8.098]]; const cols = ['var(--coral)', 'var(--blue)', 'var(--teal)']; return arcs.map(([a, b], k) => { let d = ''; for (let i = 0; i <= 80; i++) { const t = a + 0.18 + ((b - a - 0.36) * i) / 80; d += `${i ? 'L' : 'M'}${X(t).toFixed(1)} ${Y(t).toFixed(1)}`; } return `<path d="${d}" fill="none" stroke="${cols[k]}" stroke-width="9" stroke-linecap="round"/>`; }).join(''); })()}
  `),
  rockets: frame(`
    ${gridLines()}
    <circle cx="60" cy="170" r="70" fill="var(--teal)" opacity=".5"/>
    <path d="M60 100 A70 70 0 0 1 130 170" fill="none" stroke="var(--ink)" stroke-opacity=".3" stroke-width="3" stroke-dasharray="6 6"/>
    <g transform="rotate(40 200 90)">
      <path d="M200 30 C 214 46, 216 70, 214 112 H186 C 184 70, 186 46, 200 30 Z" fill="var(--card)" stroke="var(--ink)" stroke-width="4"/>
      <circle cx="200" cy="66" r="8" fill="var(--blue)"/>
      <path d="M186 96 L172 120 L186 114 Z M214 96 L228 120 L214 114 Z" fill="var(--coral)"/>
      <path d="M190 114 Q200 150 210 114 Z" fill="var(--amber)"/>
    </g>
  `),
  circles: frame(`
    ${gridLines()}
    <circle cx="160" cy="104" r="78" fill="var(--blue-soft)" stroke="var(--ink)" stroke-width="4"/>
    <line x1="160" y1="104" x2="92.5" y2="143" stroke="var(--blue)" stroke-width="4"/>
    <line x1="160" y1="104" x2="227.5" y2="143" stroke="var(--blue)" stroke-width="4"/>
    <line x1="146.5" y1="27" x2="92.5" y2="143" stroke="var(--coral)" stroke-width="4"/>
    <line x1="146.5" y1="27" x2="227.5" y2="143" stroke="var(--coral)" stroke-width="4"/>
    <circle cx="160" cy="104" r="5" fill="var(--ink)"/>
    <circle cx="146.5" cy="27" r="8" fill="var(--coral)"/><circle cx="92.5" cy="143" r="7" fill="var(--blue)"/><circle cx="227.5" cy="143" r="7" fill="var(--blue)"/>
  `),
  heat: frame(`
    ${gridLines()}
    <rect x="40" y="40" width="90" height="130" fill="var(--coral)" opacity=".75"/>
    <rect x="130" y="40" width="50" height="130" fill="var(--amber)" opacity=".85"/>
    <rect x="180" y="40" width="100" height="130" fill="var(--blue)" opacity=".55"/>
    ${[0, 1, 2].map((i) => `<path d="M70 ${70 + i * 35} h120" stroke="var(--card)" stroke-width="5" stroke-linecap="round" opacity="${1 - i * 0.2}"/><path d="M196 ${70 + i * 35} l-12 -8 v16 Z" fill="var(--card)" opacity="${1 - i * 0.2}"/>`).join('')}
  `),
  algorithms: frame(`
    ${gridLines()}
    ${[3, 7, 1, 9, 4, 11, 6, 2, 10, 5, 8, 12].map((v, i) => { const sorted = i >= 8; return `<rect x="${36 + i * 21}" y="${176 - v * 12}" width="16" height="${v * 12}" rx="3" fill="${i === 5 || i === 6 ? 'var(--coral)' : sorted ? 'var(--teal)' : 'var(--blue)'}"/>`; }).join('')}
    <line x1="30" y1="176" x2="292" y2="176" stroke="var(--ink)" stroke-width="3"/>
  `),
  inference: frame(`
    ${gridLines()}
    <path d="${Array.from({ length: 121 }, (_, i) => { const x = 30 + i * 2.2; const z = (x - 160) / 36; return `${i ? 'L' : 'M'}${x.toFixed(1)} ${(176 - 130 * Math.exp(-z * z / 2)).toFixed(1)}`; }).join(' ')}" fill="none" stroke="var(--violet)" stroke-width="5"/>
    <path d="${(() => { let d = 'M232 176'; for (let x = 232; x <= 294; x += 2) { const z = (x - 160) / 36; d += ` L${x} ${(176 - 130 * Math.exp(-z * z / 2)).toFixed(1)}`; } return d + ' L294 176 Z'; })()}" fill="var(--coral)" opacity=".7"/>
    <line x1="232" y1="40" x2="232" y2="176" stroke="var(--coral)" stroke-width="3" stroke-dasharray="6 6"/>
    <line x1="24" y1="176" x2="296" y2="176" stroke="var(--ink)" stroke-width="3"/>
  `),
  multivariable: frame(`
    ${gridLines()}
    ${[1, 2, 3, 4, 5].map((k) => `<ellipse cx="190" cy="92" rx="${k * 20}" ry="${k * 14}" fill="none" stroke="${k < 3 ? 'var(--coral)' : 'var(--blue)'}" stroke-width="3" opacity="${0.4 + 0.12 * (5 - k)}"/>`).join('')}
    <path d="M60 170 L100 150 L130 128 L155 110 L172 100 L184 95" fill="none" stroke="var(--violet)" stroke-width="4" stroke-linecap="round"/>
    ${[[60, 170], [100, 150], [130, 128], [155, 110], [172, 100]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="var(--violet)"/>`).join('')}
    <path d="M190 82 l8 14 h-16 Z" fill="var(--ink)"/>
  `),
  earthquakes: frame(`
    ${gridLines()}
    <path d="${Array.from({ length: 141 }, (_, i) => { const x = 20 + i * 2; const t = i / 140; const env = t < 0.2 ? 0.1 : t < 0.45 ? 0.35 : Math.exp(-(t - 0.45) * 5); return `${i ? 'L' : 'M'}${x} ${(100 - 60 * env * Math.sin(i * 1.3) * (t < 0.2 ? 1 : 1)).toFixed(1)}`; }).join(' ')}" fill="none" stroke="var(--ink)" stroke-width="3"/>
    <line x1="48" y1="30" x2="48" y2="170" stroke="var(--blue)" stroke-width="3" stroke-dasharray="6 6"/>
    <line x1="83" y1="30" x2="83" y2="170" stroke="var(--coral)" stroke-width="3" stroke-dasharray="6 6"/>
    <text x="48" y="186" text-anchor="middle" font-family="var(--font-sans)" font-size="16" font-weight="700" fill="var(--blue)">P</text>
    <text x="83" y="186" text-anchor="middle" font-family="var(--font-sans)" font-size="16" font-weight="700" fill="var(--coral)">S</text>
  `),
  sports: frame(`
    ${gridLines()}
    <line x1="20" y1="176" x2="300" y2="176" stroke="var(--ink)" stroke-width="3"/>
    <path d="${Array.from({ length: 61 }, (_, i) => { const x = 40 + i * 4; const t = i / 60; return `${i ? 'L' : 'M'}${x} ${(150 - 300 * t * (1 - t) - 26 * t).toFixed(1)}`; }).join(' ')}" fill="none" stroke="var(--blue)" stroke-width="4" stroke-dasharray="8 7"/>
    <circle cx="40" cy="150" r="12" fill="var(--coral)"/>
    <path d="M40 150 m-7 -6 a10 10 0 0 1 14 0" fill="none" stroke="var(--card)" stroke-width="2.5"/>
    <circle cx="280" cy="124" r="10" fill="var(--amber)"/>
  `),
  nim: frame(`
    ${gridLines()}
    ${[3, 4, 5].map((n, i) => Array.from({ length: n }, (_, k) => `<circle cx="${90 + i * 70}" cy="${164 - k * 30}" r="13" fill="${['var(--blue)', 'var(--coral)', 'var(--teal)'][i]}"/>`).join('')).join('')}
    <line x1="50" y1="182" x2="270" y2="182" stroke="var(--ink)" stroke-width="3"/>
  `),
  blackholes: frame(`
    ${gridLines()}
    <ellipse cx="160" cy="104" rx="120" ry="30" fill="none" stroke="var(--amber)" stroke-width="10" opacity=".55"/>
    <ellipse cx="160" cy="104" rx="90" ry="20" fill="none" stroke="var(--coral)" stroke-width="7" opacity=".6"/>
    <circle cx="160" cy="104" r="44" fill="var(--ink)"/>
    <path d="M118 96 A44 44 0 0 1 202 96" fill="none" stroke="var(--amber)" stroke-width="5" opacity=".8"/>
  `),
  telescopes: frame(`
    ${gridLines()}
    <g transform="rotate(-28 160 120)">
      <rect x="70" y="100" width="170" height="40" rx="8" fill="var(--blue)"/>
      <rect x="236" y="94" width="18" height="52" rx="5" fill="var(--ink)"/>
      <rect x="50" y="110" width="22" height="20" rx="4" fill="var(--ink)"/>
    </g>
    <line x1="150" y1="140" x2="120" y2="192" stroke="var(--ink)" stroke-width="5"/><line x1="150" y1="140" x2="182" y2="192" stroke="var(--ink)" stroke-width="5"/>
    <circle cx="270" cy="34" r="5" fill="var(--amber)"/><circle cx="240" cy="24" r="3" fill="var(--amber)"/><circle cx="292" cy="58" r="3" fill="var(--amber)"/>
  `),
  epidemics: frame(`
    ${gridLines()}
    <path d="${Array.from({ length: 121 }, (_, i) => { const x = 30 + i * 2.2; const z = (x - 140) / 34; return `${i ? 'L' : 'M'}${x.toFixed(1)} ${(176 - 120 * Math.exp(-z * z / 2)).toFixed(1)}`; }).join(' ')}" fill="none" stroke="var(--coral)" stroke-width="5"/>
    <path d="${Array.from({ length: 121 }, (_, i) => { const x = 30 + i * 2.2; const z = (x - 175) / 60; return `${i ? 'L' : 'M'}${x.toFixed(1)} ${(176 - 55 * Math.exp(-z * z / 2)).toFixed(1)}`; }).join(' ')}" fill="none" stroke="var(--teal)" stroke-width="5"/>
    <line x1="24" y1="176" x2="296" y2="176" stroke="var(--ink)" stroke-width="3"/>
  `),
  resonance: frame(`
    ${gridLines()}
    <path d="${Array.from({ length: 141 }, (_, i) => { const w = 0.05 + i * 0.016; const a = 1 / Math.sqrt((1 - w * w) ** 2 + (0.2 * w) ** 2); return `${i ? 'L' : 'M'}${(30 + i * 1.9).toFixed(1)} ${(176 - Math.min(150, a * 28)).toFixed(1)}`; }).join(' ')}" fill="none" stroke="var(--violet)" stroke-width="5"/>
    <path d="${Array.from({ length: 141 }, (_, i) => { const w = 0.05 + i * 0.016; const a = 1 / Math.sqrt((1 - w * w) ** 2 + (0.8 * w) ** 2); return `${i ? 'L' : 'M'}${(30 + i * 1.9).toFixed(1)} ${(176 - a * 28).toFixed(1)}`; }).join(' ')}" fill="none" stroke="var(--teal)" stroke-width="4" opacity=".7"/>
    <line x1="24" y1="176" x2="296" y2="176" stroke="var(--ink)" stroke-width="3"/>
  `),
  lasers: frame(`
    ${gridLines()}
    <rect x="30" y="84" width="110" height="40" rx="8" fill="var(--ink)"/>
    <rect x="138" y="90" width="8" height="28" fill="var(--blue)"/>
    <line x1="146" y1="104" x2="300" y2="104" stroke="var(--coral)" stroke-width="6"/>
    <line x1="146" y1="104" x2="300" y2="104" stroke="var(--coral)" stroke-width="16" opacity=".2"/>
    ${[0, 1, 2, 3, 4].map((i) => `<path d="M${46 + i * 18} 104 q4 -8 8 0 t8 0" fill="none" stroke="var(--amber)" stroke-width="2.5"/>`).join('')}
  `),
  automata: frame(`
    ${gridLines()}
    ${(() => { const W = 31, out = []; let row = new Array(W).fill(0); row[15] = 1; for (let t = 0; t < 16; t++) { row.forEach((v, i) => { if (v) out.push(`<rect x="${20 + i * 9}" y="${20 + t * 10}" width="9" height="10" fill="var(--ink)"/>`); }); row = row.map((_, i) => (row[(i + W - 1) % W] ^ row[(i + 1) % W])); } return out.join(''); })()}
  `),
  trigid: frame(`
    ${gridLines()}
    <circle cx="110" cy="104" r="66" fill="none" stroke="var(--ink)" stroke-opacity=".4" stroke-width="3"/>
    <line x1="110" y1="104" x2="160.6" y2="61.6" stroke="var(--ink)" stroke-width="4"/>
    <line x1="110" y1="104" x2="160.6" y2="104" stroke="var(--blue)" stroke-width="6"/>
    <line x1="160.6" y1="104" x2="160.6" y2="61.6" stroke="var(--coral)" stroke-width="6"/>
    <text x="242" y="112" text-anchor="middle" font-family="var(--font-display)" font-style="italic" font-size="24" fill="var(--ink)">s² + c² = 1</text>
  `),
  grid: frame(`
    ${gridLines()}
    ${[70, 160, 250].map((x) => `<path d="M${x} 180 L${x - 18} 180 L${x} 60 L${x + 18} 180 Z M${x - 26} 80 H${x + 26} M${x - 20} 100 H${x + 20}" fill="none" stroke="var(--ink)" stroke-width="4" stroke-linejoin="round"/>`).join('')}
    <path d="M44 80 Q 115 104 134 80 Q 205 104 224 80 Q 275 98 300 86" fill="none" stroke="var(--amber)" stroke-width="3"/>
    <path d="M50 100 Q 115 120 140 100 Q 205 120 230 100 Q 280 116 300 106" fill="none" stroke="var(--amber)" stroke-width="3"/>
  `),
  recursion: frame(`
    ${gridLines()}
    ${[0, 1, 2].map((i) => `<rect x="${56 + i * 100}" y="60" width="8" height="120" rx="3" fill="var(--ink)" opacity=".6"/>`).join('')}
    <line x1="20" y1="180" x2="300" y2="180" stroke="var(--ink)" stroke-width="4"/>
    ${[0, 1, 2, 3].map((k) => `<rect x="${60 - (60 - k * 12) / 2}" y="${164 - k * 18}" width="${60 - k * 12}" height="16" rx="5" fill="${['var(--blue)', 'var(--teal)', 'var(--amber)', 'var(--coral)'][k]}"/>`).join('')}
    <path d="M90 50 Q 160 10 230 50" fill="none" stroke="var(--violet)" stroke-width="3" stroke-dasharray="6 6"/>
    <path d="M230 50 l-12 -2 l6 -10 Z" fill="var(--violet)"/>
  `),
  optimization: frame(`
    ${gridLines()}
    <path d="M50 176 L210 176 L150 80 L50 56 Z" fill="var(--violet-soft)" stroke="var(--violet)" stroke-width="4" stroke-linejoin="round"/>
    <line x1="80" y1="30" x2="260" y2="140" stroke="var(--coral)" stroke-width="4" stroke-dasharray="8 7"/>
    <circle cx="150" cy="80" r="10" fill="var(--coral)"/>
    <line x1="40" y1="176" x2="290" y2="176" stroke="var(--ink)" stroke-width="3"/><line x1="50" y1="186" x2="50" y2="24" stroke="var(--ink)" stroke-width="3"/>
  `),
  randomwalks: frame(`
    ${gridLines()}
    ${(() => { let seed = 5; const u = () => ((seed = (seed * 16807) % 2147483647) / 2147483647); const cols = ['var(--blue)', 'var(--coral)', 'var(--teal)']; return cols.map((c) => { let y = 104; let d = 'M20 104'; for (let i = 1; i <= 70; i++) { y += u() < 0.5 ? 6 : -6; d += ` L${20 + i * 4} ${y}`; } return `<path d="${d}" fill="none" stroke="${c}" stroke-width="3" stroke-linejoin="round"/>`; }).join(''); })()}
  `),
  skyoptics: frame(`
    ${gridLines()}
    ${['#e5322d', '#ff7a1a', '#f2c200', '#18a058', '#2f6bff', '#7b3fd6'].map((c, i) => `<path d="M${40 + i * 8} 186 A${120 - i * 8} ${120 - i * 8} 0 0 1 ${280 - i * 8} 186" fill="none" stroke="${c}" stroke-width="8" opacity=".85"/>`).join('')}
    <circle cx="270" cy="40" r="16" fill="var(--amber)"/>
  `),
  exoplanets: frame(`
    ${gridLines()}
    <circle cx="120" cy="90" r="56" fill="var(--amber)"/>
    <circle cx="150" cy="80" r="11" fill="var(--ink)"/>
    <path d="M30 170 H150 Q160 170 165 182 H205 Q210 170 220 170 H300" fill="none" stroke="var(--blue)" stroke-width="4"/>
    <ellipse cx="120" cy="90" rx="110" ry="20" fill="none" stroke="var(--ink)" stroke-opacity=".3" stroke-width="2" stroke-dasharray="6 6"/>
  `),
  bodyphysics: frame(`
    ${gridLines()}
    <path d="M160 168 C 100 130, 70 100, 92 66 C 112 38, 150 46, 160 74 C 170 46, 208 38, 228 66 C 250 100, 220 130, 160 168 Z" fill="var(--coral)"/>
    <path d="M40 110 H110 L124 86 L140 140 L154 98 L162 110 H290" fill="none" stroke="var(--ink)" stroke-width="4" stroke-linejoin="round" opacity=".75"/>
  `),
  graphsread: frame(`
    ${gridLines()}
    <rect x="60" y="120" width="60" height="56" rx="5" fill="var(--blue)"/>
    <rect x="150" y="40" width="60" height="136" rx="5" fill="var(--coral)"/>
    <line x1="40" y1="176" x2="250" y2="176" stroke="var(--ink)" stroke-width="3"/>
    <path d="M40 176 V30 M34 150 l12 -6 M34 158 l12 -6" fill="none" stroke="var(--ink)" stroke-width="3"/>
    <circle cx="262" cy="70" r="26" fill="none" stroke="var(--ink)" stroke-width="5"/><line x1="281" y1="89" x2="300" y2="108" stroke="var(--ink)" stroke-width="6" stroke-linecap="round"/>
  `),
  primes: frame(`
    ${gridLines()}
    ${(() => { const out = []; const isP = (n) => { if (n < 2) return false; for (let d = 2; d * d <= n; d++) if (n % d === 0) return false; return true; }; for (let i = 0; i < 60; i++) { const n = i + 1, x = 34 + (i % 12) * 22, y = 34 + Math.floor(i / 12) * 30; out.push(`<rect x="${x}" y="${y}" width="18" height="24" rx="4" fill="${isP(n) ? 'var(--coral)' : 'var(--card)'}" stroke="var(--line-2)"/>`); } return out.join(''); })()}
  `),
  curves: frame(`
    ${gridLines()}
    <path d="${Array.from({ length: 61 }, (_, i) => { const t = (i / 60) * Math.PI; return `${i ? 'L' : 'M'}${(40 + 70 * (t - Math.sin(t))).toFixed(1)} ${(40 + 70 * (1 - Math.cos(t))).toFixed(1)}`; }).join(' ')}" fill="none" stroke="var(--violet)" stroke-width="5"/>
    <line x1="40" y1="40" x2="${(40 + 70 * Math.PI).toFixed(1)}" y2="180" stroke="var(--ink)" stroke-opacity=".35" stroke-width="3" stroke-dasharray="7 6"/>
    <circle cx="40" cy="40" r="9" fill="var(--coral)"/><circle cx="${(40 + 70 * Math.PI).toFixed(1)}" cy="180" r="9" fill="var(--teal)"/>
  `),
  statmech: frame(`${gridLines()}
    <path d="M30.0 150.0 L36.4 148.2 L42.8 142.8 L49.2 134.2 L55.6 123.2 L62.0 110.5 L68.4 96.9 L74.8 83.5 L81.2 71.1 L87.6 60.5 L94.0 52.1 L100.4 46.5 L106.8 43.7 L113.2 43.7 L119.6 46.2 L126.0 51.1 L132.4 57.7 L138.8 65.6 L145.2 74.4 L151.6 83.5 L158.0 92.6 L164.4 101.3 L170.8 109.4 L177.2 116.8 L183.6 123.2 L190.0 128.8 L196.4 133.4 L202.8 137.3 L209.2 140.4 L215.6 142.8 L222.0 144.7 L228.4 146.2 L234.8 147.3 L241.2 148.1 L247.6 148.7 L254.0 149.1 L260.4 149.4 L266.8 149.6 L273.2 149.7 L279.6 149.8 L286.0 149.9 L286 150 L30 150 Z" class="fl-violet-soft"/>
    <path d="M30.0 150.0 L36.4 148.2 L42.8 142.8 L49.2 134.2 L55.6 123.2 L62.0 110.5 L68.4 96.9 L74.8 83.5 L81.2 71.1 L87.6 60.5 L94.0 52.1 L100.4 46.5 L106.8 43.7 L113.2 43.7 L119.6 46.2 L126.0 51.1 L132.4 57.7 L138.8 65.6 L145.2 74.4 L151.6 83.5 L158.0 92.6 L164.4 101.3 L170.8 109.4 L177.2 116.8 L183.6 123.2 L190.0 128.8 L196.4 133.4 L202.8 137.3 L209.2 140.4 L215.6 142.8 L222.0 144.7 L228.4 146.2 L234.8 147.3 L241.2 148.1 L247.6 148.7 L254.0 149.1 L260.4 149.4 L266.8 149.6 L273.2 149.7 L279.6 149.8 L286.0 149.9" fill="none" stroke="var(--violet)" stroke-width="5" stroke-linecap="round"/>
    <circle cx="200" cy="40" r="9" class="fl-coral"/><line x1="200" y1="40" x2="236" y2="28" stroke="var(--coral)" stroke-width="3" stroke-linecap="round"/>
    <circle cx="250" cy="72" r="9" class="fl-teal"/><line x1="250" y1="72" x2="262" y2="98" stroke="var(--teal)" stroke-width="3" stroke-linecap="round"/>
    <circle cx="160" cy="28" r="9" class="fl-amber"/><line x1="160" y1="28" x2="146" y2="14" stroke="var(--amber)" stroke-width="3" stroke-linecap="round"/>
  `),
  maps: frame(`${gridLines()}
    <circle cx="160" cy="88" r="62" class="fl-teal-soft" stroke="var(--teal)" stroke-width="4"/>
    <ellipse cx="160" cy="88" rx="62" ry="16" fill="none" stroke="var(--teal)" stroke-width="2.5" stroke-dasharray="5 5"/>
    <ellipse cx="160" cy="88" rx="24" ry="62" fill="none" stroke="var(--teal)" stroke-width="2.5"/>
    <path d="M128 100 Q160 20 196 98" fill="none" stroke="var(--coral)" stroke-width="5" stroke-linecap="round"/>
    <circle cx="128" cy="100" r="7" class="fl-coral"/><circle cx="196" cy="98" r="7" class="fl-coral"/>
  `),
  tides: frame(`${gridLines()}
    <ellipse cx="120" cy="90" rx="66" ry="46" class="fl-blue-soft" stroke="var(--blue)" stroke-width="3" stroke-dasharray="7 6"/>
    <circle cx="120" cy="90" r="42" class="fl-teal" stroke="var(--teal)" stroke-width="3"/>
    <circle cx="250" cy="90" r="16" class="fl-surface" stroke="var(--ink-3)" stroke-width="3"/>
    <path d="M168 90 L192 90 M184 82 L192 90 L184 98" fill="none" stroke="var(--coral)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M72 90 L48 90 M56 82 L48 90 L56 98" fill="none" stroke="var(--coral)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  `),
  constructions: frame(`${gridLines()}
    <circle cx="130" cy="110" r="60" fill="none" stroke="var(--blue)" stroke-width="3" stroke-dasharray="7 6"/>
    <circle cx="190" cy="110" r="60" fill="none" stroke="var(--coral)" stroke-width="3" stroke-dasharray="7 6"/>
    <path d="M130 110 L160 58 L190 110 Z" class="fl-teal-soft" stroke="var(--teal)" stroke-width="4" stroke-linejoin="round"/>
    <circle cx="130" cy="110" r="6" class="fl-ink"/><circle cx="190" cy="110" r="6" class="fl-ink"/><circle cx="160" cy="58" r="6" class="fl-amber"/>
  `),
  crypto: frame(`${gridLines()}
    <rect x="118" y="78" width="84" height="66" rx="12" class="fl-violet" stroke="var(--ink)" stroke-width="3"/>
    <path d="M136 78 V58 a24 24 0 0 1 48 0 V78" fill="none" stroke="var(--ink)" stroke-width="7" stroke-linecap="round"/>
    <circle cx="160" cy="104" r="8" class="fl-ink"/><rect x="156" y="106" width="8" height="20" rx="3" class="fl-ink"/>
    <text x="40" y="60" style="font: 700 22px var(--font-mono, monospace); fill: var(--coral)">K X R</text>
    <text x="226" y="140" style="font: 700 22px var(--font-mono, monospace); fill: var(--teal)">0 1 1</text>
  `),
  weather: frame(`${gridLines()}
    <circle cx="210" cy="62" r="30" class="fl-amber"/>
    <path d="M90 128 a26 26 0 0 1 22 -40 a34 34 0 0 1 64 -6 a24 24 0 0 1 36 22 a22 22 0 0 1 -6 24 Z" class="fl-card" stroke="var(--ink)" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="M60 150 q20 -10 40 0 t40 0 t40 0 t40 0 t40 0" fill="none" stroke="var(--blue)" stroke-width="4" stroke-linecap="round"/>
  `),
  waveoptics: frame(`${gridLines()}
    <rect x="70" y="40" width="10" height="100" class="fl-ink"/>
    <rect x="70" y="80" width="10" height="8" class="fl-card"/><rect x="70" y="96" width="10" height="8" class="fl-card"/>
    <path d="M80 60 A30 30 0 0 1 80 120 M80 40 A50 50 0 0 1 80 140 M80 24 A70 70 0 0 1 80 156 M80 8 A90 90 0 0 1 80 172" fill="none" stroke="var(--violet)" stroke-width="3" opacity=".6"/>
    ${[0,1,2,3,4,5,6].map((i) => `<rect x="236" y="${34 + i * 16}" width="20" height="9" rx="3" style="fill: hsl(${10 + i * 40}, 85%, 55%)"/>`).join('')}
  `),
  computability: frame(`${gridLines()}
    ${[0,1,2,3,4,5].map((i) => `<rect x="${52 + i * 38}" y="60" width="32" height="36" rx="6" class="${i === 3 ? 'fl-amber-soft' : 'fl-card'}" stroke="var(--ink)" stroke-width="2.5"/><text x="${68 + i * 38}" y="85" text-anchor="middle" style="font: 700 18px var(--font-mono, monospace); fill: var(--ink)">${'101101'[i]}</text>`).join('')}
    <path d="M184 104 l-10 14 h20 Z" class="fl-coral"/>
    <rect x="160" y="122" width="48" height="24" rx="12" class="fl-coral"/>
    <text x="184" y="139" text-anchor="middle" style="font: 700 14px var(--font-sans, sans-serif); fill: var(--card)">A</text>
  `),
  neural: frame(`${gridLines()}
    ${[[70,50],[70,90],[70,130]].map(([x,y]) => [[160,40],[160,90],[160,140]].map(([a,b]) => `<line x1="${x}" y1="${y}" x2="${a}" y2="${b}" stroke="var(--ink-3)" stroke-width="2"/>`).join('')).join('')}
    ${[[160,40],[160,90],[160,140]].map(([x,y]) => `<line x1="${x}" y1="${y}" x2="250" y2="90" stroke="var(--ink-3)" stroke-width="2"/>`).join('')}
    ${[[70,50],[70,90],[70,130]].map(([x,y]) => `<circle cx="${x}" cy="${y}" r="13" class="fl-blue" stroke="var(--ink)" stroke-width="2.5"/>`).join('')}
    ${[[160,40],[160,90],[160,140]].map(([x,y]) => `<circle cx="${x}" cy="${y}" r="13" class="fl-violet" stroke="var(--ink)" stroke-width="2.5"/>`).join('')}
    <circle cx="250" cy="90" r="15" class="fl-coral" stroke="var(--ink)" stroke-width="2.5"/>
  `),
  materials: frame(`${gridLines()}
    <path d="M60 150 L60 110 A100 100 0 0 1 260 110 L260 150 L230 150 L230 112 A70 70 0 0 0 90 112 L90 150 Z" class="fl-amber-soft" stroke="var(--amber)" stroke-width="3.5" stroke-linejoin="round"/>
    ${[...Array(9)].map((_, i) => { const a = Math.PI * (i + 1) / 10; return `<line x1="${160 - 70 * Math.cos(a)}" y1="${112 - 70 * Math.sin(a)}" x2="${160 - 100 * Math.cos(a)}" y2="${110 - 100 * Math.sin(a)}" stroke="var(--amber)" stroke-width="2.5"/>`; }).join('')}
    <path d="M150 8 L170 8 L166 40 L154 40 Z" class="fl-coral" stroke="var(--ink)" stroke-width="2.5"/>
  `),
  geoprob: frame(`${gridLines()}
    <rect x="90" y="30" width="130" height="130" fill="none" stroke="var(--ink)" stroke-width="3"/>
    <path d="M220 160 A130 130 0 0 0 90 30" fill="none" stroke="var(--violet)" stroke-width="4"/>
    ${[[110,140],[130,90],[150,120],[180,140],[120,60],[170,80],[200,50],[210,70],[140,45],[195,110],[105,100],[160,150]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" class="${(x-90)**2 + (y-160)**2 < 130**2 ? 'fl-blue' : 'fl-coral'}"/>`).join('')}
  `),
  quantumcomp: frame(`${gridLines()}
    <circle cx="120" cy="90" r="62" fill="none" stroke="var(--ink-3)" stroke-width="3"/>
    <line x1="48" y1="90" x2="192" y2="90" stroke="var(--line-2)" stroke-width="2"/><line x1="120" y1="18" x2="120" y2="162" stroke="var(--line-2)" stroke-width="2"/>
    <line x1="120" y1="90" x2="164" y2="46" stroke="var(--violet)" stroke-width="5" stroke-linecap="round"/><circle cx="164" cy="46" r="8" class="fl-violet"/>
    <rect x="218" y="70" width="22" height="70" rx="4" class="fl-blue"/><rect x="250" y="70" width="22" height="70" rx="4" class="fl-coral"/>
    <rect x="218" y="40" width="22" height="100" rx="4" fill="none" stroke="var(--line-2)" stroke-width="2"/><rect x="250" y="40" width="22" height="100" rx="4" fill="none" stroke="var(--line-2)" stroke-width="2"/>
  `),
  numerics: frame(`${gridLines()}
    <path d="M40 150 Q140 150 280 20" fill="none" stroke="var(--violet)" stroke-width="5" stroke-linecap="round"/>
    <line x1="30" y1="120" x2="290" y2="120" stroke="var(--ink-3)" stroke-width="2.5"/>
    <line x1="250" y1="48" x2="196" y2="120" stroke="var(--coral)" stroke-width="3.5"/>
    <line x1="196" y1="120" x2="196" y2="98" stroke="var(--ink-3)" stroke-width="2" stroke-dasharray="4 4"/>
    <line x1="196" y1="98" x2="168" y2="120" stroke="var(--coral)" stroke-width="3.5"/>
    <circle cx="250" cy="48" r="6" class="fl-ink"/><circle cx="196" cy="120" r="5" class="fl-ink"/><circle cx="168" cy="120" r="7" class="fl-coral"/>
  `),
  matching: frame(`${gridLines()}
    ${[40,90,140].map((y,i) => `<line x1="100" y1="${y}" x2="220" y2="${[90,40,140][i]}" stroke="var(--violet)" stroke-width="5"/>`).join('')}
    ${[40,90,140].map((y) => `<circle cx="100" cy="${y}" r="16" class="fl-blue" stroke="var(--ink)" stroke-width="3"/><circle cx="220" cy="${y}" r="16" class="fl-amber" stroke="var(--ink)" stroke-width="3"/>`).join('')}
  `),
  viscous: frame(`${gridLines()}
    <line x1="40" y1="40" x2="280" y2="40" stroke="var(--ink)" stroke-width="5"/><line x1="40" y1="140" x2="280" y2="140" stroke="var(--ink)" stroke-width="5"/>
    <path d="M90 40 Q290 90 90 140" fill="none" stroke="var(--blue)" stroke-width="4"/>
    ${[55,70,90,110,125].map((y) => { const L = 100 * (1 - ((y - 90) / 50) ** 2); return `<line x1="90" y1="${y}" x2="${90 + L}" y2="${y}" stroke="var(--blue)" stroke-width="3" stroke-linecap="round"/><path d="M${90 + L - 8} ${y - 5} L${90 + L} ${y} L${90 + L - 8} ${y + 5}" fill="none" stroke="var(--blue)" stroke-width="3" stroke-linecap="round"/>`; }).join('')}
  `),
  sampling: frame(`${gridLines()}
    <line x1="30" y1="90" x2="290" y2="90" stroke="var(--ink-3)" stroke-width="2"/>
    <path d="M40.0 90.0 L42.4 83.7 L44.8 77.6 L47.2 71.6 L49.6 65.9 L52.0 60.6 L54.4 55.8 L56.8 51.5 L59.2 47.8 L61.6 44.8 L64.0 42.4 L66.4 40.9 L68.8 40.1 L71.2 40.1 L73.6 40.9 L76.0 42.4 L78.4 44.8 L80.8 47.8 L83.2 51.5 L85.6 55.8 L88.0 60.6 L90.4 65.9 L92.8 71.6 L95.2 77.6 L97.6 83.7 L100.0 90.0 L102.4 96.3 L104.8 102.4 L107.2 108.4 L109.6 114.1 L112.0 119.4 L114.4 124.2 L116.8 128.5 L119.2 132.2 L121.6 135.2 L124.0 137.6 L126.4 139.1 L128.8 139.9 L131.2 139.9 L133.6 139.1 L136.0 137.6 L138.4 135.2 L140.8 132.2 L143.2 128.5 L145.6 124.2 L148.0 119.4 L150.4 114.1 L152.8 108.4 L155.2 102.4 L157.6 96.3 L160.0 90.0 L162.4 83.7 L164.8 77.6 L167.2 71.6 L169.6 65.9 L172.0 60.6 L174.4 55.8 L176.8 51.5 L179.2 47.8 L181.6 44.8 L184.0 42.4 L186.4 40.9 L188.8 40.1 L191.2 40.1 L193.6 40.9 L196.0 42.4 L198.4 44.8 L200.8 47.8 L203.2 51.5 L205.6 55.8 L208.0 60.6 L210.4 65.9 L212.8 71.6 L215.2 77.6 L217.6 83.7 L220.0 90.0 L222.4 96.3 L224.8 102.4 L227.2 108.4 L229.6 114.1 L232.0 119.4 L234.4 124.2 L236.8 128.5 L239.2 132.2 L241.6 135.2 L244.0 137.6 L246.4 139.1 L248.8 139.9 L251.2 139.9 L253.6 139.1 L256.0 137.6 L258.4 135.2 L260.8 132.2 L263.2 128.5 L265.6 124.2 L268.0 119.4 L270.4 114.1 L272.8 108.4 L275.2 102.4 L277.6 96.3 L280.0 90.0" fill="none" stroke="var(--violet)" stroke-width="4" stroke-linecap="round"/>
    <line x1="40" y1="90" x2="40" y2="90.0" stroke="var(--teal)" stroke-width="3"/><circle cx="40" cy="90.0" r="6" class="fl-coral"/><line x1="60" y1="90" x2="60" y2="46.7" stroke="var(--teal)" stroke-width="3"/><circle cx="60" cy="46.7" r="6" class="fl-coral"/><line x1="80" y1="90" x2="80" y2="46.7" stroke="var(--teal)" stroke-width="3"/><circle cx="80" cy="46.7" r="6" class="fl-coral"/><line x1="100" y1="90" x2="100" y2="90.0" stroke="var(--teal)" stroke-width="3"/><circle cx="100" cy="90.0" r="6" class="fl-coral"/><line x1="120" y1="90" x2="120" y2="133.3" stroke="var(--teal)" stroke-width="3"/><circle cx="120" cy="133.3" r="6" class="fl-coral"/><line x1="140" y1="90" x2="140" y2="133.3" stroke="var(--teal)" stroke-width="3"/><circle cx="140" cy="133.3" r="6" class="fl-coral"/><line x1="160" y1="90" x2="160" y2="90.0" stroke="var(--teal)" stroke-width="3"/><circle cx="160" cy="90.0" r="6" class="fl-coral"/><line x1="180" y1="90" x2="180" y2="46.7" stroke="var(--teal)" stroke-width="3"/><circle cx="180" cy="46.7" r="6" class="fl-coral"/><line x1="200" y1="90" x2="200" y2="46.7" stroke="var(--teal)" stroke-width="3"/><circle cx="200" cy="46.7" r="6" class="fl-coral"/><line x1="220" y1="90" x2="220" y2="90.0" stroke="var(--teal)" stroke-width="3"/><circle cx="220" cy="90.0" r="6" class="fl-coral"/><line x1="240" y1="90" x2="240" y2="133.3" stroke="var(--teal)" stroke-width="3"/><circle cx="240" cy="133.3" r="6" class="fl-coral"/><line x1="260" y1="90" x2="260" y2="133.3" stroke="var(--teal)" stroke-width="3"/><circle cx="260" cy="133.3" r="6" class="fl-coral"/><line x1="280" y1="90" x2="280" y2="90.0" stroke="var(--teal)" stroke-width="3"/><circle cx="280" cy="90.0" r="6" class="fl-coral"/>
  `),
  rc: frame(`${gridLines()}
    <line x1="40" y1="150" x2="290" y2="150" stroke="var(--ink-3)" stroke-width="2.5"/><line x1="40" y1="20" x2="40" y2="150" stroke="var(--ink-3)" stroke-width="2.5"/>
    <path d="M40 150 L45 140.4 L50 131.6 L55 123.5 L60 116.0 L65 109.1 L70 102.8 L75 97.0 L80 91.6 L85 86.7 L90 82.2 L95 78.0 L100 74.1 L105 70.6 L110 67.4 L115 64.4 L120 61.6 L125 59.1 L130 56.8 L135 54.6 L140 52.7 L145 50.9 L150 49.2 L155 47.7 L160 46.2 L165 44.9 L170 43.7 L175 42.6 L180 41.6 L185 40.7 L190 39.9 L195 39.1 L200 38.3 L205 37.7 L210 37.1 L215 36.5 L220 36.0 L225 35.5 L230 35.1 L235 34.7 L240 34.3 L245 33.9 L250 33.6 L255 33.3 L260 33.1 L265 32.8 L270 32.6 L275 32.4 L280 32.2 L285 32.0 L290 31.9" fill="none" stroke="var(--violet)" stroke-width="5" stroke-linecap="round"/>
    <line x1="40" y1="30" x2="290" y2="30" stroke="var(--ink-3)" stroke-width="2" stroke-dasharray="6 6"/>
    <line x1="100" y1="150" x2="100" y2="74" stroke="var(--coral)" stroke-width="2.5" stroke-dasharray="5 5"/><circle cx="100" cy="74" r="6" class="fl-coral"/>
  `),
  inequalities: frame(`${gridLines()}
    <path d="M60 140 A100 100 0 0 1 260 140" fill="none" stroke="var(--ink-3)" stroke-width="3"/>
    <line x1="60" y1="140" x2="120" y2="140" stroke="var(--blue)" stroke-width="6"/><line x1="120" y1="140" x2="260" y2="140" stroke="var(--coral)" stroke-width="6"/>
    <line x1="160" y1="140" x2="160" y2="40" stroke="var(--teal)" stroke-width="4" stroke-dasharray="8 6"/>
    <line x1="120" y1="140" x2="120" y2="48.3" stroke="var(--violet)" stroke-width="5"/><circle cx="120" cy="48.3" r="7" class="fl-violet"/>
  `),
  cosmology: frame(`${gridLines()}
    <circle cx="150" cy="106" r="2.5" class="fl-ink" opacity="0.5"/><circle cx="291" cy="22" r="2" class="fl-ink" opacity="0.5"/><circle cx="147" cy="28" r="1.5" class="fl-ink" opacity="0.5"/><circle cx="77" cy="110" r="2" class="fl-ink" opacity="0.5"/><circle cx="146" cy="112" r="2.5" class="fl-ink" opacity="0.5"/><circle cx="72" cy="161" r="1.5" class="fl-ink" opacity="0.5"/><circle cx="26" cy="70" r="2" class="fl-ink" opacity="0.5"/><circle cx="163" cy="61" r="2" class="fl-ink" opacity="0.5"/><circle cx="101" cy="33" r="1.5" class="fl-ink" opacity="0.5"/><circle cx="247" cy="47" r="1.5" class="fl-ink" opacity="0.5"/><circle cx="20" cy="16" r="1.5" class="fl-ink" opacity="0.5"/><circle cx="130" cy="57" r="1.5" class="fl-ink" opacity="0.5"/><circle cx="168" cy="95" r="1.5" class="fl-ink" opacity="0.5"/><circle cx="296" cy="67" r="1.5" class="fl-ink" opacity="0.5"/><circle cx="120" cy="113" r="2" class="fl-ink" opacity="0.5"/><circle cx="31" cy="107" r="2" class="fl-ink" opacity="0.5"/><circle cx="104" cy="52" r="2" class="fl-ink" opacity="0.5"/><circle cx="53" cy="99" r="2" class="fl-ink" opacity="0.5"/><circle cx="21" cy="101" r="1.5" class="fl-ink" opacity="0.5"/><circle cx="178" cy="105" r="2" class="fl-ink" opacity="0.5"/><circle cx="266" cy="95" r="1.5" class="fl-ink" opacity="0.5"/><circle cx="266" cy="135" r="2.5" class="fl-ink" opacity="0.5"/><circle cx="110" cy="29" r="2" class="fl-ink" opacity="0.5"/><circle cx="31" cy="106" r="2" class="fl-ink" opacity="0.5"/><circle cx="29" cy="155" r="2" class="fl-ink" opacity="0.5"/><circle cx="207" cy="111" r="2.5" class="fl-ink" opacity="0.5"/>
    <ellipse cx="160" cy="90" rx="120" ry="60" fill="none" stroke="var(--violet)" stroke-width="3" stroke-dasharray="8 7" opacity="0.7"/>
    <ellipse cx="160" cy="90" rx="78" ry="38" fill="none" stroke="var(--blue)" stroke-width="3" opacity="0.8"/>
    <ellipse cx="160" cy="90" rx="36" ry="17" class="fl-amber" opacity="0.9"/>
  `),
  perspective: frame(`${gridLines()}
    <line x1="20" y1="60" x2="300" y2="60" stroke="var(--teal)" stroke-width="2.5"/>
    <path d="M40 170 L160 60 L280 170 Z" class="fl-surface" stroke="var(--ink-3)" stroke-width="2.5"/>
    <path d="M100 170 L160 60 L220 170" fill="none" stroke="var(--ink)" stroke-width="3.5"/>
    ${[[170,10],[148,8],[124,6],[106,4.5],[94,3.4]].map(([y, w]) => { const k = (y - 60) / 110; return `<line x1="${160 - 60 * k}" y1="${y}" x2="${160 + 60 * k}" y2="${y}" stroke="var(--amber)" stroke-width="${w}" stroke-linecap="round"/>`; }).join('')}
    <circle cx="160" cy="60" r="6" class="fl-coral"/>
  `),
  powerlaws: frame(`${gridLines()}
    <line x1="40" y1="150" x2="290" y2="150" stroke="var(--ink-3)" stroke-width="2.5"/>
    <rect x="48" y="29.6" width="18" height="120.4" rx="3" class="fl-violet"/><rect x="74" y="79.6" width="18" height="70.4" rx="3" class="fl-violet"/><rect x="100" y="100.0" width="18" height="50.0" rx="3" class="fl-violet"/><rect x="126" y="111.2" width="18" height="38.8" rx="3" class="fl-violet"/><rect x="152" y="118.3" width="18" height="31.7" rx="3" class="fl-violet"/><rect x="178" y="123.2" width="18" height="26.8" rx="3" class="fl-violet"/><rect x="204" y="126.8" width="18" height="23.2" rx="3" class="fl-violet"/><rect x="230" y="129.5" width="18" height="20.5" rx="3" class="fl-violet"/><rect x="256" y="131.7" width="18" height="18.3" rx="3" class="fl-violet"/>
    <text x="57" y="22" text-anchor="middle" style="font: 700 16px var(--font-sans, sans-serif); fill: var(--ink)">1</text>
  `),
  populations: frame(`${gridLines()}
    <path d="M30.0 95.0 L32.6 89.4 L35.2 83.8 L37.8 78.4 L40.4 73.3 L43.0 68.5 L45.6 64.2 L48.2 60.3 L50.8 57.0 L53.4 54.3 L56.0 52.2 L58.6 50.8 L61.2 50.1 L63.8 50.1 L66.4 50.8 L69.0 52.2 L71.6 54.3 L74.2 57.0 L76.8 60.3 L79.4 64.2 L82.0 68.5 L84.6 73.3 L87.2 78.4 L89.8 83.8 L92.4 89.4 L95.0 95.0 L97.6 100.6 L100.2 106.2 L102.8 111.6 L105.4 116.7 L108.0 121.5 L110.6 125.8 L113.2 129.7 L115.8 133.0 L118.4 135.7 L121.0 137.8 L123.6 139.2 L126.2 139.9 L128.8 139.9 L131.4 139.2 L134.0 137.8 L136.6 135.7 L139.2 133.0 L141.8 129.7 L144.4 125.8 L147.0 121.5 L149.6 116.7 L152.2 111.6 L154.8 106.2 L157.4 100.6 L160.0 95.0 L162.6 89.4 L165.2 83.8 L167.8 78.4 L170.4 73.3 L173.0 68.5 L175.6 64.2 L178.2 60.3 L180.8 57.0 L183.4 54.3 L186.0 52.2 L188.6 50.8 L191.2 50.1 L193.8 50.1 L196.4 50.8 L199.0 52.2 L201.6 54.3 L204.2 57.0 L206.8 60.3 L209.4 64.2 L212.0 68.5 L214.6 73.3 L217.2 78.4 L219.8 83.8 L222.4 89.4 L225.0 95.0 L227.6 100.6 L230.2 106.2 L232.8 111.6 L235.4 116.7 L238.0 121.5 L240.6 125.8 L243.2 129.7 L245.8 133.0 L248.4 135.7 L251.0 137.8 L253.6 139.2 L256.2 139.9 L258.8 139.9 L261.4 139.2 L264.0 137.8 L266.6 135.7 L269.2 133.0 L271.8 129.7 L274.4 125.8 L277.0 121.5 L279.6 116.7 L282.2 111.6 L284.8 106.2 L287.4 100.6 L290.0 95.0" fill="none" stroke="var(--blue)" stroke-width="5" stroke-linecap="round"/>
    <path d="M30.0 142.3 L32.6 140.7 L35.2 138.8 L37.8 136.5 L40.4 134.1 L43.0 131.4 L45.6 128.5 L48.2 125.5 L50.8 122.4 L53.4 119.2 L56.0 116.1 L58.6 113.0 L61.2 110.1 L63.8 107.3 L66.4 104.7 L69.0 102.3 L71.6 100.3 L74.2 98.5 L76.8 97.1 L79.4 96.0 L82.0 95.3 L84.6 95.0 L87.2 95.1 L89.8 95.6 L92.4 96.5 L95.0 97.7 L97.6 99.3 L100.2 101.2 L102.8 103.5 L105.4 105.9 L108.0 108.6 L110.6 111.5 L113.2 114.5 L115.8 117.6 L118.4 120.8 L121.0 123.9 L123.6 127.0 L126.2 129.9 L128.8 132.7 L131.4 135.3 L134.0 137.7 L136.6 139.7 L139.2 141.5 L141.8 142.9 L144.4 144.0 L147.0 144.7 L149.6 145.0 L152.2 144.9 L154.8 144.4 L157.4 143.5 L160.0 142.3 L162.6 140.7 L165.2 138.8 L167.8 136.5 L170.4 134.1 L173.0 131.4 L175.6 128.5 L178.2 125.5 L180.8 122.4 L183.4 119.2 L186.0 116.1 L188.6 113.0 L191.2 110.1 L193.8 107.3 L196.4 104.7 L199.0 102.3 L201.6 100.3 L204.2 98.5 L206.8 97.1 L209.4 96.0 L212.0 95.3 L214.6 95.0 L217.2 95.1 L219.8 95.6 L222.4 96.5 L225.0 97.7 L227.6 99.3 L230.2 101.2 L232.8 103.5 L235.4 105.9 L238.0 108.6 L240.6 111.5 L243.2 114.5 L245.8 117.6 L248.4 120.8 L251.0 123.9 L253.6 127.0 L256.2 129.9 L258.8 132.7 L261.4 135.3 L264.0 137.7 L266.6 139.7 L269.2 141.5 L271.8 142.9 L274.4 144.0 L277.0 144.7 L279.6 145.0 L282.2 144.9 L284.8 144.4 L287.4 143.5 L290.0 142.3" fill="none" stroke="var(--coral)" stroke-width="5" stroke-linecap="round"/>
  `),
  gyroscopes: frame(`${gridLines()}
    <ellipse cx="160" cy="70" rx="110" ry="30" fill="none" stroke="var(--ink-3)" stroke-width="2.5" stroke-dasharray="7 6"/>
    <line x1="160" y1="70" x2="160" y2="165" stroke="var(--ink-3)" stroke-width="6"/>
    <line x1="160" y1="70" x2="250" y2="88" stroke="var(--ink)" stroke-width="6" stroke-linecap="round"/>
    <ellipse cx="250" cy="88" rx="16" ry="44" class="fl-violet-soft" stroke="var(--violet)" stroke-width="4"/>
    <circle cx="160" cy="70" r="7" class="fl-ink"/>
    <path d="M80 92 A110 30 0 0 0 140 100" fill="none" stroke="var(--coral)" stroke-width="4" stroke-linecap="round"/>
    <path d="M132 94 L142 100 L132 106" fill="none" stroke="var(--coral)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  `),
  spacetime: frame(`${gridLines()}
    <path d="M70 165 L160 75 L250 165" fill="none" stroke="var(--amber)" stroke-width="3" stroke-dasharray="7 6"/>
    <path d="M70 -15 L160 75 L250 -15" fill="none" stroke="var(--amber)" stroke-width="3" stroke-dasharray="7 6"/>
    <path d="M160 75 L70 165 L250 165 Z" class="fl-amber-soft" opacity="0.5"/>
    <path d="M160 75 L70 -15 L250 -15 Z" class="fl-amber-soft" opacity="0.5"/>
    <line x1="160" y1="165" x2="160" y2="10" stroke="var(--blue)" stroke-width="5"/>
    <path d="M160 165 L205 95 L160 25" fill="none" stroke="var(--coral)" stroke-width="5" stroke-linejoin="round"/>
    <circle cx="160" cy="75" r="6" class="fl-ink"/>
  `),
  periodic: frame(`${gridLines()}
    <rect x="25.0" y="35" width="13" height="24" rx="3" class="fl-blue" opacity="0.85"/><rect x="288.5" y="35" width="13" height="24" rx="3" class="fl-teal" opacity="0.85"/><rect x="25.0" y="63" width="13" height="24" rx="3" class="fl-coral" opacity="0.85"/><rect x="40.5" y="63" width="13" height="24" rx="3" class="fl-amber" opacity="0.85"/><rect x="211.0" y="63" width="13" height="24" rx="3" class="fl-violet" opacity="0.85"/><rect x="226.5" y="63" width="13" height="24" rx="3" class="fl-violet" opacity="0.85"/><rect x="242.0" y="63" width="13" height="24" rx="3" class="fl-violet" opacity="0.85"/><rect x="257.5" y="63" width="13" height="24" rx="3" class="fl-violet" opacity="0.85"/><rect x="273.0" y="63" width="13" height="24" rx="3" class="fl-violet" opacity="0.85"/><rect x="288.5" y="63" width="13" height="24" rx="3" class="fl-teal" opacity="0.85"/><rect x="25.0" y="91" width="13" height="24" rx="3" class="fl-coral" opacity="0.85"/><rect x="40.5" y="91" width="13" height="24" rx="3" class="fl-amber" opacity="0.85"/><rect x="211.0" y="91" width="13" height="24" rx="3" class="fl-violet" opacity="0.85"/><rect x="226.5" y="91" width="13" height="24" rx="3" class="fl-violet" opacity="0.85"/><rect x="242.0" y="91" width="13" height="24" rx="3" class="fl-violet" opacity="0.85"/><rect x="257.5" y="91" width="13" height="24" rx="3" class="fl-violet" opacity="0.85"/><rect x="273.0" y="91" width="13" height="24" rx="3" class="fl-violet" opacity="0.85"/><rect x="288.5" y="91" width="13" height="24" rx="3" class="fl-teal" opacity="0.85"/><rect x="25.0" y="119" width="13" height="24" rx="3" class="fl-coral" opacity="0.85"/><rect x="40.5" y="119" width="13" height="24" rx="3" class="fl-amber" opacity="0.85"/><rect x="56.0" y="119" width="13" height="24" rx="3" class="fl-blue" opacity="0.85"/><rect x="71.5" y="119" width="13" height="24" rx="3" class="fl-blue" opacity="0.85"/><rect x="87.0" y="119" width="13" height="24" rx="3" class="fl-blue" opacity="0.85"/><rect x="102.5" y="119" width="13" height="24" rx="3" class="fl-blue" opacity="0.85"/><rect x="118.0" y="119" width="13" height="24" rx="3" class="fl-blue" opacity="0.85"/><rect x="133.5" y="119" width="13" height="24" rx="3" class="fl-blue" opacity="0.85"/><rect x="149.0" y="119" width="13" height="24" rx="3" class="fl-blue" opacity="0.85"/><rect x="164.5" y="119" width="13" height="24" rx="3" class="fl-blue" opacity="0.85"/><rect x="180.0" y="119" width="13" height="24" rx="3" class="fl-blue" opacity="0.85"/><rect x="195.5" y="119" width="13" height="24" rx="3" class="fl-blue" opacity="0.85"/><rect x="211.0" y="119" width="13" height="24" rx="3" class="fl-violet" opacity="0.85"/><rect x="226.5" y="119" width="13" height="24" rx="3" class="fl-violet" opacity="0.85"/><rect x="242.0" y="119" width="13" height="24" rx="3" class="fl-violet" opacity="0.85"/><rect x="257.5" y="119" width="13" height="24" rx="3" class="fl-violet" opacity="0.85"/><rect x="273.0" y="119" width="13" height="24" rx="3" class="fl-violet" opacity="0.85"/><rect x="288.5" y="119" width="13" height="24" rx="3" class="fl-teal" opacity="0.85"/>
  `),
  origami: frame(`${gridLines()}
    <path d="M70 140 L120 50 L170 120 L220 40 L260 130 Z" class="fl-amber-soft" stroke="var(--amber)" stroke-width="3" stroke-linejoin="round"/>
    <path d="M120 50 L170 120" stroke="var(--coral)" stroke-width="4"/>
    <path d="M170 120 L220 40" stroke="var(--blue)" stroke-width="4" stroke-dasharray="8 6"/>
    <path d="M70 140 L170 120 L260 130" fill="none" stroke="var(--violet)" stroke-width="3"/>
  `),
  navigation: frame(`${gridLines()}
    <circle cx="160" cy="90" r="62" class="fl-card" stroke="var(--ink)" stroke-width="4"/>
    <circle cx="160" cy="90" r="52" fill="none" stroke="var(--line-2)" stroke-width="2"/>
    <path d="M160 40 L174 90 L160 140 L146 90 Z" class="fl-coral" stroke="var(--ink)" stroke-width="2"/>
    <path d="M160 90 L174 90 L160 140 L146 90 Z" class="fl-surface" stroke="var(--ink)" stroke-width="2"/>
    <circle cx="160" cy="90" r="5" class="fl-ink"/>
    <path d="M262 30 l4 10 l10 0 l-8 6 l3 10 l-9 -6 l-9 6 l3 -10 l-8 -6 l10 0 Z" class="fl-amber"/>
  `),
  oceanwaves: frame(`${gridLines()}
    <path d="M20.0 100.0 L22.8 95.9 L25.6 91.9 L28.4 88.2 L31.2 84.9 L34.0 82.2 L36.8 80.1 L39.6 78.7 L42.4 78.0 L45.2 78.2 L48.0 79.1 L50.8 80.7 L53.6 83.0 L56.4 86.0 L59.2 89.4 L62.0 93.2 L64.8 97.2 L67.6 101.4 L70.4 105.5 L73.2 109.4 L76.0 112.9 L78.8 116.0 L81.6 118.6 L84.4 120.5 L87.2 121.6 L90.0 122.0 L92.8 121.6 L95.6 120.5 L98.4 118.6 L101.2 116.0 L104.0 112.9 L106.8 109.4 L109.6 105.5 L112.4 101.4 L115.2 97.2 L118.0 93.2 L120.8 89.4 L123.6 86.0 L126.4 83.0 L129.2 80.7 L132.0 79.1 L134.8 78.2 L137.6 78.0 L140.4 78.7 L143.2 80.1 L146.0 82.2 L148.8 84.9 L151.6 88.2 L154.4 91.9 L157.2 95.9 L160.0 100.0 L162.8 104.1 L165.6 108.1 L168.4 111.8 L171.2 115.1 L174.0 117.8 L176.8 119.9 L179.6 121.3 L182.4 122.0 L185.2 121.8 L188.0 120.9 L190.8 119.3 L193.6 117.0 L196.4 114.0 L199.2 110.6 L202.0 106.8 L204.8 102.8 L207.6 98.6 L210.4 94.5 L213.2 90.6 L216.0 87.1 L218.8 84.0 L221.6 81.4 L224.4 79.5 L227.2 78.4 L230.0 78.0 L232.8 78.4 L235.6 79.5 L238.4 81.4 L241.2 84.0 L244.0 87.1 L246.8 90.6 L249.6 94.5 L252.4 98.6 L255.2 102.8 L258.0 106.8 L260.8 110.6 L263.6 114.0 L266.4 117.0 L269.2 119.3 L272.0 120.9 L274.8 121.8 L277.6 122.0 L280.4 121.3 L283.2 119.9 L286.0 117.8 L288.8 115.1 L291.6 111.8 L294.4 108.1 L297.2 104.1 L300.0 100.0 L300 180 L20 180 Z" class="fl-blue-soft" stroke="var(--blue)" stroke-width="4"/>
    <circle cx="80" cy="110" r="14" fill="none" stroke="var(--teal)" stroke-width="2" stroke-dasharray="4 4"/><circle cx="80" cy="140" r="7" fill="none" stroke="var(--teal)" stroke-width="2" stroke-dasharray="4 4"/><circle cx="160" cy="110" r="14" fill="none" stroke="var(--teal)" stroke-width="2" stroke-dasharray="4 4"/><circle cx="160" cy="140" r="7" fill="none" stroke="var(--teal)" stroke-width="2" stroke-dasharray="4 4"/><circle cx="240" cy="110" r="14" fill="none" stroke="var(--teal)" stroke-width="2" stroke-dasharray="4 4"/><circle cx="240" cy="140" r="7" fill="none" stroke="var(--teal)" stroke-width="2" stroke-dasharray="4 4"/>
  `),
  planets: frame(`${gridLines()}
    <ellipse cx="160" cy="92" rx="118" ry="26" fill="none" stroke="var(--amber)" stroke-width="8" opacity="0.55"/>
    <circle cx="160" cy="92" r="52" class="fl-amber" stroke="var(--ink)" stroke-width="3"/>
    <path d="M42 92 A118 26 0 0 0 278 92" fill="none" stroke="var(--amber)" stroke-width="8"/>
    <circle cx="276" cy="36" r="9" class="fl-surface" stroke="var(--ink-3)" stroke-width="2.5"/>
  `),
  contfrac: frame(`${gridLines()}
    <rect x="40" y="30" width="130" height="130" class="fl-blue-soft" stroke="var(--blue)" stroke-width="3"/>
    <rect x="170" y="30" width="80" height="80" class="fl-coral-soft" stroke="var(--coral)" stroke-width="3"/>
    <rect x="170" y="110" width="50" height="50" class="fl-teal-soft" stroke="var(--teal)" stroke-width="3"/>
    <rect x="220" y="110" width="30" height="30" class="fl-amber-soft" stroke="var(--amber)" stroke-width="3"/>
    <rect x="220" y="140" width="20" height="20" class="fl-violet-soft" stroke="var(--violet)" stroke-width="3"/>
    <rect x="240" y="140" width="10" height="10" class="fl-pink-soft" stroke="var(--pink)" stroke-width="2"/>
  `),
  decisions: frame(`${gridLines()}
    <line x1="50" y1="90" x2="130" y2="90" stroke="var(--ink)" stroke-width="4"/>
    <line x1="130" y1="90" x2="210" y2="45" stroke="var(--teal)" stroke-width="4"/><line x1="130" y1="90" x2="210" y2="135" stroke="var(--coral)" stroke-width="4"/>
    <rect x="38" y="78" width="24" height="24" rx="4" class="fl-ink"/><circle cx="130" cy="90" r="11" class="fl-amber" stroke="var(--ink)" stroke-width="2.5"/>
    <circle cx="225" cy="45" r="15" class="fl-teal"/><circle cx="225" cy="135" r="15" class="fl-coral"/>
    <text x="250" y="51" style="font: 700 16px var(--font-sans, sans-serif); fill: var(--ink)">£££</text>
    <text x="250" y="141" style="font: 700 16px var(--font-sans, sans-serif); fill: var(--ink)">£0</text>
  `),
  coding: frame(`
    ${gridLines()}
    <rect x="22" y="30" width="132" height="140" rx="12" fill="var(--card)" stroke="var(--ink)" stroke-opacity=".18" stroke-width="2"/>
    <rect x="36" y="48" width="58" height="10" rx="5" fill="var(--violet)"/>
    <rect x="52" y="70" width="70" height="10" rx="5" fill="var(--blue)"/>
    <rect x="52" y="92" width="52" height="10" rx="5" fill="var(--blue)"/>
    <rect x="52" y="114" width="80" height="10" rx="5" fill="var(--blue)" opacity=".55"/>
    <rect x="36" y="136" width="34" height="10" rx="5" fill="var(--violet)"/>
    <path d="M30 109 h14" stroke="var(--amber)" stroke-width="6" stroke-linecap="round"/>
    ${[0, 1, 2, 3].map((i) => [0, 1, 2].map((j) => { const wall = (i === 1 && j === 0) || (i === 3 && j === 0) || (i === 2 && j === 1); return `<rect x="${176 + i * 32}" y="${52 + j * 32}" width="28" height="28" rx="6" fill="${wall ? 'var(--ink)' : 'var(--card)'}" opacity="${wall ? 0.18 : 1}" stroke="var(--ink)" stroke-opacity=".14"/>`; }).join('')).join('')}
    <path d="M190 66 V130 H286" fill="none" stroke="var(--blue)" stroke-width="4" stroke-dasharray="2 8" stroke-linecap="round"/>
    <path d="M247 130 l7 -8 l7 8 l-7 8 Z" fill="var(--amber)"/>
    <path d="M282 142 V116" stroke="var(--ink)" stroke-width="3" stroke-linecap="round"/><path d="M283 116 l14 5 l-14 5 Z" fill="var(--teal)"/>
    <circle cx="190" cy="98" r="12" fill="var(--blue)"/><path d="M184 93 L196 93 L190 104 Z" fill="#fff"/>
  `),
  algebra: frame(`
    ${gridLines()}
    ${[0, 1, 2].map((i) => `<rect x="${34 + i * 26}" y="58" width="20" height="84" rx="5" fill="var(--blue)"/>`).join('')}
    ${[0, 1].map((i) => `<rect x="${118 + i * 26}" y="122" width="20" height="20" rx="4" fill="var(--amber)"/>`).join('')}
    <text x="186" y="112" style="font: 700 30px var(--font-sans, sans-serif); fill: var(--ink)">=</text>
    <rect x="214" y="58" width="20" height="84" rx="5" fill="var(--blue)"/>
    <rect x="240" y="58" width="20" height="84" rx="5" fill="var(--blue)"/>
    <rect x="266" y="58" width="20" height="84" rx="5" fill="var(--blue)"/>
    <rect x="292" y="122" width="20" height="20" rx="4" fill="var(--amber)"/>
    <rect x="292" y="96" width="20" height="20" rx="4" fill="var(--amber)"/>
    <text x="96" y="178" text-anchor="middle" style="font: italic 500 24px var(--font-display, serif); fill: var(--ink)">3x + 2</text>
    <text x="262" y="178" text-anchor="middle" style="font: italic 500 24px var(--font-display, serif); fill: var(--ink)">3x + 2</text>
    <text x="160" y="40" text-anchor="middle" style="font: italic 500 22px var(--font-display, serif); fill: var(--violet)">a(b + c) = ab + ac</text>
  `),
  polar: frame(`
    ${[24, 44, 64].map((r) => `<circle cx="100" cy="100" r="${r}" fill="none" stroke="var(--ink)" stroke-opacity=".12" stroke-width="2"/>`).join('')}
    ${[0, 30, 60, 90, 120, 150].map((a) => `<path d="M${100 - 70 * Math.cos(a * Math.PI / 180)} ${100 - 70 * Math.sin(a * Math.PI / 180)} L${100 + 70 * Math.cos(a * Math.PI / 180)} ${100 + 70 * Math.sin(a * Math.PI / 180)}" stroke="var(--ink)" stroke-opacity=".1" stroke-width="2"/>`).join('')}
    <path d="M${Array.from({ length: 361 }, (_, i) => { const t = (i / 360) * 2 * Math.PI, r = 62 * Math.cos(4 * t); return `${(100 + r * Math.cos(t)).toFixed(1)} ${(100 - r * Math.sin(t)).toFixed(1)}`; }).join('L')}" fill="var(--pink)" fill-opacity=".18" stroke="var(--pink)" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="M${Array.from({ length: 301 }, (_, i) => { const t = (i / 300) * 2 * Math.PI; return `${(235 + 50 * Math.cos(3 * t)).toFixed(1)} ${(100 - 62 * Math.sin(2 * t)).toFixed(1)}`; }).join('L')}" fill="none" stroke="var(--teal)" stroke-width="3.5" stroke-linejoin="round"/>
    <circle cx="100" cy="100" r="5" fill="var(--ink)"/>
  `),
  graphics: frame(`
    ${Array.from({ length: 10 }, (_, i) => Array.from({ length: 6 }, (_, j) => `<rect x="${20 + i * 14}" y="${40 + j * 14}" width="12" height="12" rx="2" fill="var(--ink)" opacity="${Math.abs(j - (5 - i * 0.5)) < 0.5 ? 0.75 : 0.07}"/>`).join('')).join('')}
    <path d="M168 160 C 190 40, 260 40, 296 150" fill="none" stroke="var(--violet)" stroke-width="5" stroke-linecap="round"/>
    <path d="M168 160 L190 40 L260 40 L296 150" fill="none" stroke="var(--ink)" stroke-opacity=".35" stroke-width="2" stroke-dasharray="5 5"/>
    <circle cx="168" cy="160" r="6" fill="var(--ink)"/><circle cx="296" cy="150" r="6" fill="var(--ink)"/>
    <circle cx="190" cy="40" r="6" fill="var(--coral)"/><circle cx="260" cy="40" r="6" fill="var(--coral)"/>
    <circle cx="96" cy="160" r="26" fill="var(--blue)"/><circle cx="88" cy="152" r="9" fill="#fff" opacity=".7"/>
  `),
  reactions: frame(`
    ${gridLines()}
    <path d="M24 150 C 70 150, 90 150, 120 90 C 140 50, 170 50, 190 90 C 215 140, 240 165, 296 165" fill="none" stroke="var(--blue)" stroke-width="5" stroke-linecap="round"/>
    <path d="M24 150 C 70 150, 100 150, 125 115 C 140 95, 165 95, 180 115 C 210 150, 240 165, 296 165" fill="none" stroke="var(--violet)" stroke-width="4" stroke-dasharray="8 7" stroke-linecap="round"/>
    <circle cx="44" cy="126" r="11" fill="var(--blue)"/><circle cx="64" cy="126" r="11" fill="var(--coral)"/>
    <circle cx="258" cy="140" r="11" fill="var(--violet)"/><circle cx="282" cy="140" r="11" fill="var(--teal)"/>
    <circle cx="155" cy="44" r="6" fill="var(--amber)"/><circle cx="170" cy="30" r="4" fill="var(--amber)"/><circle cx="140" cy="30" r="4" fill="var(--amber)"/>
  `),
  control: frame(`
    ${gridLines()}
    <path d="M20 160 H300" stroke="var(--ink)" stroke-opacity=".45" stroke-width="2"/>
    <path d="M20 70 H300" stroke="var(--ink)" stroke-opacity=".35" stroke-width="2" stroke-dasharray="8 7"/>
    <path d="M${Array.from({ length: 141 }, (_, i) => { const t = i / 140 * 10; return `${20 + t * 28} ${70 + 90 * Math.exp(-0.45 * t) * Math.cos(1.6 * t)}`; }).join('L')}" fill="none" stroke="var(--blue)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M${Array.from({ length: 141 }, (_, i) => { const t = i / 140 * 10; return `${20 + t * 28} ${70 + 90 * (1 + 1.4 * t) * Math.exp(-1.4 * t)}`; }).join('L')}" fill="none" stroke="var(--coral)" stroke-width="4" stroke-linecap="round" stroke-dasharray="2 9"/>
    <g transform="translate(262 40)"><rect x="-22" y="-8" width="44" height="12" rx="6" fill="var(--ink)"/><path d="M-30 -8 h18 M12 -8 h18" stroke="var(--violet)" stroke-width="4" stroke-linecap="round"/></g>
  `),
  markov: frame(`
    ${gridLines()}
    <path d="M96 82 Q 160 30 224 82" fill="none" stroke="var(--ink)" stroke-opacity=".45" stroke-width="3"/>
    <path d="M224 118 Q 160 170 96 118" fill="none" stroke="var(--ink)" stroke-opacity=".45" stroke-width="3"/>
    <path d="M216 74 l10 9 l-13 3 z" fill="var(--ink)" opacity=".6"/><path d="M104 126 l-10 -9 l13 -3 z" fill="var(--ink)" opacity=".6"/>
    <path d="M58 72 C 30 20, 100 20, 84 72" fill="none" stroke="var(--amber)" stroke-width="3"/>
    <path d="M262 128 C 290 180, 220 180, 236 128" fill="none" stroke="var(--blue)" stroke-width="3"/>
    <circle cx="70" cy="100" r="32" fill="var(--amber-soft)" stroke="var(--amber)" stroke-width="4"/>
    <circle cx="250" cy="100" r="32" fill="var(--blue-soft)" stroke="var(--blue)" stroke-width="4"/>
    <circle cx="70" cy="100" r="11" fill="var(--amber)"/>
    <path d="M238 100 a12 12 0 0 1 24 0 z M250 100 v12" fill="var(--blue)" stroke="var(--blue)" stroke-width="3"/>
  `),
  ml: frame(`
    ${gridLines()}
    <path d="M40 180 L170 20" stroke="var(--violet)" stroke-width="4" stroke-dasharray="9 7" stroke-linecap="round"/>
    ${[[60, 60], [80, 95], [50, 110], [105, 70], [95, 130], [70, 140]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9" fill="var(--blue)"/>`).join('')}
    ${[[150, 120], [175, 90], [190, 150], [140, 160], [205, 115], [165, 175]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9" fill="var(--coral)"/>`).join('')}
    <circle cx="118" cy="104" r="10" fill="var(--violet)" stroke="var(--card)" stroke-width="3"/>
    <rect x="232" y="44" width="70" height="22" rx="6" fill="var(--card)" stroke="var(--ink)" stroke-opacity=".3" stroke-width="2"/>
    <path d="M267 66 V84 M267 84 H247 V100 M267 84 H287 V100" stroke="var(--ink)" stroke-opacity=".45" stroke-width="2.5" fill="none"/>
    <rect x="230" y="100" width="34" height="20" rx="5" fill="var(--blue)"/><rect x="270" y="100" width="34" height="20" rx="5" fill="var(--coral)"/>
  `),
  vectorcalc: frame(`
    ${gridLines()}
    ${Array.from({ length: 9 }, (_, i) => Array.from({ length: 6 }, (_, j) => { const x = 24 + i * 34, y = 22 + j * 32, dx = x - 160, dy = y - 100, rr = Math.hypot(dx, dy) || 1, ux = -dy / rr, uy = dx / rr, L = 12; return `<path d="M${x - ux * L} ${y - uy * L} L${x + ux * L} ${y + uy * L}" stroke="var(--blue)" stroke-width="3" stroke-linecap="round" opacity=".55"/><circle cx="${x + ux * L}" cy="${y + uy * L}" r="3" fill="var(--blue)" opacity=".7"/>`; }).join('')).join('')}
    <g transform="translate(160 100)"><circle r="26" fill="var(--card)" stroke="var(--ink)" stroke-opacity=".3" stroke-width="2"/><path d="M0 0 L22 -8 M0 0 L8 22 M0 0 L-22 8 M0 0 L-8 -22" stroke="var(--coral)" stroke-width="5" stroke-linecap="round"/><circle r="5" fill="var(--ink)"/></g>
  `),
  bonding: frame(`
    ${gridLines()}
    <path d="M160 96 L96 140 M160 96 L224 140" stroke="var(--ink)" stroke-opacity=".75" stroke-width="7" stroke-linecap="round"/>
    <circle cx="160" cy="96" r="34" fill="var(--coral-soft)" stroke="var(--coral)" stroke-width="5"/>
    <text x="160" y="107" text-anchor="middle" font-family="Figtree, sans-serif" font-weight="700" font-size="30" fill="var(--ink)">O</text>
    <circle cx="96" cy="140" r="22" fill="var(--card)" stroke="var(--ink)" stroke-opacity=".45" stroke-width="4"/>
    <circle cx="224" cy="140" r="22" fill="var(--card)" stroke="var(--ink)" stroke-opacity=".45" stroke-width="4"/>
    <text x="96" y="148" text-anchor="middle" font-family="Figtree, sans-serif" font-weight="700" font-size="21" fill="var(--ink)">H</text>
    <text x="224" y="148" text-anchor="middle" font-family="Figtree, sans-serif" font-weight="700" font-size="21" fill="var(--ink)">H</text>
    <circle cx="146" cy="46" r="5" fill="var(--ink)"/><circle cx="174" cy="46" r="5" fill="var(--ink)"/>
    <circle cx="112" cy="78" r="5" fill="var(--ink)"/><circle cx="122" cy="58" r="5" fill="var(--ink)"/>
    <circle cx="262" cy="52" r="7" fill="var(--blue)"/><path d="M262 52 C 240 30, 210 30, 196 46" fill="none" stroke="var(--blue)" stroke-width="3" stroke-dasharray="5 6"/>
  `),
  shapes: frame(`
    ${gridLines()}
    <path d="M160 104 L160 34 M160 104 L98 140 M160 104 L222 140" stroke="var(--ink)" stroke-opacity=".7" stroke-width="7" stroke-linecap="round"/>
    <path d="M160 104 L182 168" stroke="var(--ink)" stroke-opacity=".35" stroke-width="7" stroke-linecap="round" stroke-dasharray="2 10"/>
    <circle cx="182" cy="168" r="17" fill="var(--card)" stroke="var(--ink)" stroke-opacity=".3" stroke-width="3"/>
    <circle cx="160" cy="34" r="20" fill="var(--card)" stroke="var(--ink)" stroke-opacity=".5" stroke-width="4"/>
    <circle cx="98" cy="140" r="20" fill="var(--card)" stroke="var(--ink)" stroke-opacity=".5" stroke-width="4"/>
    <circle cx="222" cy="140" r="20" fill="var(--card)" stroke="var(--ink)" stroke-opacity=".5" stroke-width="4"/>
    <circle cx="160" cy="104" r="28" fill="var(--ink)"/>
    <ellipse cx="151" cy="94" rx="9" ry="5" fill="#fff" opacity=".25" transform="rotate(-30 151 94)"/>
    <path d="M126 70 A 48 48 0 0 1 192 70" fill="none" stroke="var(--blue)" stroke-width="4"/>
    <text x="214" y="70" font-family="Figtree, sans-serif" font-weight="700" font-size="18" fill="var(--blue)">109.5°</text>
  `),
  imf: frame(`
    ${gridLines()}
    <g stroke="var(--ink)" stroke-opacity=".7" stroke-width="6" stroke-linecap="round">
      <path d="M82 92 L58 120 M82 92 L112 108"/><path d="M200 70 L176 44 M200 70 L232 62"/><path d="M226 150 L250 176 M226 150 L196 160"/>
    </g>
    <path d="M118 112 L166 70" stroke="var(--blue)" stroke-width="4" stroke-dasharray="6 7" stroke-linecap="round"/>
    <path d="M200 96 L218 128" stroke="var(--blue)" stroke-width="4" stroke-dasharray="6 7" stroke-linecap="round"/>
    <circle cx="82" cy="92" r="22" fill="var(--coral-soft)" stroke="var(--coral)" stroke-width="4"/>
    <circle cx="200" cy="70" r="22" fill="var(--coral-soft)" stroke="var(--coral)" stroke-width="4"/>
    <circle cx="226" cy="150" r="22" fill="var(--coral-soft)" stroke="var(--coral)" stroke-width="4"/>
    <g fill="var(--card)" stroke="var(--ink)" stroke-opacity=".45" stroke-width="3">
      <circle cx="58" cy="120" r="13"/><circle cx="112" cy="108" r="13"/><circle cx="176" cy="44" r="13"/><circle cx="232" cy="62" r="13"/><circle cx="250" cy="176" r="13"/><circle cx="196" cy="160" r="13"/>
    </g>
  `),
  thermochem: frame(`
    ${gridLines()}
    <path d="M30 70 H96" stroke="var(--ink)" stroke-width="5" stroke-linecap="round"/>
    <path d="M128 30 H190" stroke="var(--coral)" stroke-width="5" stroke-linecap="round"/>
    <path d="M222 160 H290" stroke="var(--blue)" stroke-width="5" stroke-linecap="round"/>
    <path d="M96 70 L128 30 M190 30 L222 160" stroke="var(--ink)" stroke-opacity=".35" stroke-width="3" stroke-dasharray="6 6"/>
    <path d="M63 70 V150 H256 V160" fill="none" stroke="var(--violet)" stroke-width="4" stroke-dasharray="2 8" stroke-linecap="round"/>
    <path d="M150 112 c -14 -18, 10 -26, 0 -46 c 22 14, 28 34, 14 50 c 8 -10, -2 -18, -6 -22 c 0 10, -6 14, -8 18 z" fill="var(--amber)" stroke="var(--coral)" stroke-width="3"/>
  `),
  equilibrium: frame(`
    ${gridLines()}
    <path d="M20 160 C 70 160, 90 80, 150 64 S 250 60, 300 60" fill="none" stroke="var(--coral)" stroke-width="5" stroke-linecap="round"/>
    <path d="M20 40 C 70 40, 90 120, 150 136 S 250 140, 300 140" fill="none" stroke="var(--blue)" stroke-width="5" stroke-linecap="round"/>
    <path d="M196 92 H262" stroke="var(--ink)" stroke-width="4" stroke-linecap="round"/><path d="M262 92 l-10 -7 v7 z" fill="var(--ink)"/>
    <path d="M262 108 H196" stroke="var(--ink)" stroke-width="4" stroke-linecap="round"/><path d="M196 108 l10 7 v-7 z" fill="var(--ink)"/>
  `),
  acids: frame(`
    ${gridLines()}
    <defs><linearGradient id="cv-acids" x1="0" x2="1"><stop offset="0" stop-color="#d7301f"/><stop offset=".35" stop-color="#f2c12e"/><stop offset=".55" stop-color="#2aa36b"/><stop offset=".8" stop-color="#2f5bd3"/><stop offset="1" stop-color="#8e3fa8"/></linearGradient></defs>
    <rect x="30" y="150" width="260" height="18" rx="9" fill="url(#cv-acids)"/>
    <path d="M40 130 C 120 128, 140 120, 150 90 C 158 60, 170 52, 280 50" fill="none" stroke="var(--ink)" stroke-width="5" stroke-linecap="round"/>
    <circle cx="150" cy="90" r="8" fill="var(--coral)"/>
    <path d="M226 18 v38 c0 14 -24 14 -24 0 v-38" fill="var(--blue-soft)" stroke="var(--blue)" stroke-width="3"/>
  `),
  electrochem: frame(`
    ${gridLines()}
    <path d="M40 80 V170 H130 V80 M190 80 V170 H280 V80" fill="none" stroke="var(--ink)" stroke-width="4"/>
    <rect x="42" y="110" width="86" height="58" fill="var(--blue)" opacity=".18"/><rect x="192" y="110" width="86" height="58" fill="var(--blue)" opacity=".18"/>
    <rect x="76" y="56" width="16" height="96" rx="3" fill="#8c9aa6"/><rect x="226" y="56" width="16" height="96" rx="3" fill="#c8743f"/>
    <path d="M110 130 V96 H210 V130" fill="none" stroke="var(--teal)" stroke-opacity=".5" stroke-width="12" stroke-linejoin="round"/>
    <path d="M84 56 V26 H234 V56" fill="none" stroke="var(--ink)" stroke-width="3"/>
    <rect x="132" y="12" width="56" height="28" rx="8" fill="var(--card)" stroke="var(--ink)" stroke-width="3"/>
    <text x="160" y="32" text-anchor="middle" font-family="Figtree, sans-serif" font-weight="700" font-size="15" fill="var(--ink)">1.10 V</text>
    <circle cx="108" cy="26" r="5" fill="var(--blue)"/><circle cx="208" cy="26" r="5" fill="var(--blue)"/>
  `),
  organic: frame(`
    ${gridLines()}
    <path d="M70 120 L70 80 L104 60 L138 80 L138 120 L104 140 Z" fill="none" stroke="var(--ink)" stroke-width="5" stroke-linejoin="round"/>
    <circle cx="104" cy="100" r="22" fill="none" stroke="var(--ink)" stroke-width="3.5"/>
    <path d="M138 80 L172 60 L206 80 L240 60 L274 80" fill="none" stroke="var(--ink)" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>
    <path d="M206 80 L206 120" stroke="var(--ink)" stroke-width="5" stroke-linecap="round"/>
    <path d="M240 60 L240 28 M248 60 L248 28" stroke="var(--coral)" stroke-width="4" stroke-linecap="round"/>
    <text x="244" y="22" text-anchor="middle" font-family="Figtree, sans-serif" font-weight="700" font-size="18" fill="var(--coral)">O</text>
    <text x="206" y="142" text-anchor="middle" font-family="Figtree, sans-serif" font-weight="700" font-size="18" fill="var(--blue)">NH₂</text>
  `),
  chirality: frame(`
    ${gridLines()}
    <path d="M160 20 V180" stroke="var(--ink)" stroke-opacity=".35" stroke-width="3" stroke-dasharray="6 7"/>
    <g stroke="var(--ink)" stroke-opacity=".7" stroke-width="6" stroke-linecap="round">
      <path d="M96 100 L96 46 M96 100 L50 128 M96 100 L132 132"/><path d="M224 100 L224 46 M224 100 L270 128 M224 100 L188 132"/>
    </g>
    <path d="M96 100 L82 150 M224 100 L238 150" stroke="var(--ink)" stroke-opacity=".3" stroke-width="6" stroke-dasharray="2 8" stroke-linecap="round"/>
    <circle cx="96" cy="100" r="17" fill="var(--ink)"/><circle cx="224" cy="100" r="17" fill="var(--ink)"/>
    <circle cx="96" cy="46" r="15" fill="var(--pink-soft)" stroke="var(--pink)" stroke-width="4"/><circle cx="224" cy="46" r="15" fill="var(--pink-soft)" stroke="var(--pink)" stroke-width="4"/>
    <circle cx="50" cy="128" r="14" fill="var(--teal-soft)" stroke="var(--teal)" stroke-width="4"/><circle cx="270" cy="128" r="14" fill="var(--teal-soft)" stroke="var(--teal)" stroke-width="4"/>
    <circle cx="132" cy="132" r="13" fill="var(--blue-soft)" stroke="var(--blue)" stroke-width="4"/><circle cx="188" cy="132" r="13" fill="var(--blue-soft)" stroke="var(--blue)" stroke-width="4"/>
    <circle cx="82" cy="150" r="10" fill="var(--card)" stroke="var(--ink)" stroke-opacity=".4" stroke-width="3"/><circle cx="238" cy="150" r="10" fill="var(--card)" stroke="var(--ink)" stroke-opacity=".4" stroke-width="3"/>
  `),
  mechanisms: frame(`
    ${gridLines()}
    <path d="M150 120 L210 120" stroke="var(--ink)" stroke-opacity=".75" stroke-width="6" stroke-linecap="round"/>
    <circle cx="80" cy="120" r="24" fill="var(--coral-soft)" stroke="var(--coral)" stroke-width="4"/>
    <text x="80" y="128" text-anchor="middle" font-family="Figtree, sans-serif" font-weight="700" font-size="20" fill="var(--ink)">O</text>
    <circle cx="150" cy="120" r="22" fill="var(--ink)"/>
    <circle cx="240" cy="120" r="26" fill="var(--pink-soft)" stroke="var(--pink)" stroke-width="4"/>
    <text x="240" y="128" text-anchor="middle" font-family="Figtree, sans-serif" font-weight="700" font-size="18" fill="var(--ink)">Br</text>
    <circle cx="74" cy="88" r="4" fill="var(--ink)"/><circle cx="86" cy="88" r="4" fill="var(--ink)"/>
    <path d="M92 86 Q 118 40 146 92" fill="none" stroke="var(--coral)" stroke-width="5" stroke-linecap="round"/><path d="M146 92 l-3 -15 l-10 9 z" fill="var(--coral)"/>
    <path d="M180 112 Q 205 60 236 90" fill="none" stroke="var(--coral)" stroke-width="5" stroke-linecap="round"/><path d="M236 90 l-2 -15 l-11 8 z" fill="var(--coral)"/>
    <path d="M150 120 L136 170 M150 120 L172 168" stroke="var(--ink)" stroke-opacity=".5" stroke-width="5" stroke-linecap="round"/>
  `),
  spectroscopy: frame(`
    ${gridLines()}
    <path d="M20 170 H300" stroke="var(--ink)" stroke-opacity=".45" stroke-width="2"/>
    <path d="M40 170 V150 M60 170 V110 M80 170 V60 M100 170 V110 M120 170 V150" stroke="var(--blue)" stroke-width="5" stroke-linecap="round"/>
    <path d="M190 170 V120 M210 170 V70 M230 170 V120" stroke="var(--teal)" stroke-width="5" stroke-linecap="round"/>
    <path d="M150 30 C 160 30, 165 30, 170 60 C 175 92, 180 92, 186 60 C 190 34, 196 30, 300 30" fill="none" stroke="var(--violet)" stroke-width="4" stroke-linecap="round"/>
    <path d="M20 30 H140" stroke="var(--violet)" stroke-width="4" stroke-linecap="round" stroke-opacity=".5"/>
    <text x="262" y="150" font-family="Figtree, sans-serif" font-weight="700" font-size="16" fill="var(--ink)" opacity=".6">δ</text>
  `),
  colour: frame(`
    <defs><linearGradient id="cv-colour" x1="0" x2="1"><stop offset="0" stop-color="#7a3cff"/><stop offset=".2" stop-color="#2f5bd3"/><stop offset=".4" stop-color="#1fa594"/><stop offset=".55" stop-color="#9bd12a"/><stop offset=".7" stop-color="#f2c12e"/><stop offset=".85" stop-color="#ff8a2a"/><stop offset="1" stop-color="#e3342f"/></linearGradient></defs>
    ${gridLines()}
    <rect x="20" y="150" width="280" height="22" rx="4" fill="url(#cv-colour)"/>
    <path d="M80 172 C 90 110, 110 110, 120 172" fill="var(--ink)" opacity=".2"/>
    <path d="M60 140 L60 40 L100 40 L100 140 Q 80 160 60 140 Z" fill="#f29a2e" stroke="var(--ink)" stroke-width="3"/>
    <path d="M140 140 L140 40 L180 40 L180 140 Q 160 160 140 140 Z" fill="#2f5bd3" stroke="var(--ink)" stroke-width="3"/>
    <path d="M220 140 L220 40 L260 40 L260 140 Q 240 160 220 140 Z" fill="#8e3fa8" stroke="var(--ink)" stroke-width="3"/>
  `),
  biochem: frame(`
    ${gridLines()}
    <path d="M60 40 H100 V80 H140 V40 H180 V80 H220 V120 H180 V160 H140 V120 H100 V160 H60 V120" fill="none" stroke="var(--ink)" stroke-opacity=".6" stroke-width="5" stroke-linejoin="round"/>
    <path d="M100 80 L100 120 M140 80 L140 120 M180 80 L180 120" stroke="var(--amber)" stroke-width="4" stroke-dasharray="4 5"/>
    <g stroke-width="3">
      <circle cx="60" cy="40" r="10" fill="var(--blue-soft)" stroke="var(--blue)"/><circle cx="100" cy="40" r="10" fill="var(--blue-soft)" stroke="var(--blue)"/>
      <circle cx="100" cy="80" r="10" fill="var(--amber)" stroke="var(--warn)"/><circle cx="140" cy="80" r="10" fill="var(--amber)" stroke="var(--warn)"/>
      <circle cx="140" cy="40" r="10" fill="var(--blue-soft)" stroke="var(--blue)"/><circle cx="180" cy="40" r="10" fill="var(--blue-soft)" stroke="var(--blue)"/>
      <circle cx="180" cy="80" r="10" fill="var(--amber)" stroke="var(--warn)"/><circle cx="220" cy="80" r="10" fill="var(--blue-soft)" stroke="var(--blue)"/>
      <circle cx="220" cy="120" r="10" fill="var(--blue-soft)" stroke="var(--blue)"/><circle cx="180" cy="120" r="10" fill="var(--amber)" stroke="var(--warn)"/>
      <circle cx="180" cy="160" r="10" fill="var(--blue-soft)" stroke="var(--blue)"/><circle cx="140" cy="160" r="10" fill="var(--blue-soft)" stroke="var(--blue)"/>
      <circle cx="140" cy="120" r="10" fill="var(--amber)" stroke="var(--warn)"/><circle cx="100" cy="120" r="10" fill="var(--amber)" stroke="var(--warn)"/>
      <circle cx="100" cy="160" r="10" fill="var(--blue-soft)" stroke="var(--blue)"/><circle cx="60" cy="160" r="10" fill="var(--blue-soft)" stroke="var(--blue)"/><circle cx="60" cy="120" r="10" fill="var(--blue-soft)" stroke="var(--blue)"/>
    </g>
    <path d="M250 30 C 290 60, 250 90, 290 120 C 330 150, 250 170, 290 195" fill="none" stroke="var(--coral)" stroke-width="4"/>
    <path d="M290 30 C 250 60, 290 90, 250 120 C 210 150, 290 170, 250 195" fill="none" stroke="var(--teal)" stroke-width="4"/>
  `),
  drugs: frame(`
    ${gridLines()}
    <path d="M70 40 V150 H250 V40" fill="none" stroke="var(--ink)" stroke-opacity=".25" stroke-width="30" stroke-linejoin="round"/>
    <circle cx="70" cy="70" r="14" fill="var(--coral)"/><circle cx="160" cy="150" r="14" fill="var(--amber)"/><circle cx="250" cy="70" r="14" fill="var(--blue)"/>
    <path d="M140 76 L160 64 L180 76 L180 100 L160 112 L140 100 Z" fill="var(--card)" stroke="var(--ink)" stroke-width="4"/>
    <path d="M140 88 L104 76 M160 112 L160 130 M180 88 L216 76" stroke="var(--ink)" stroke-width="4" stroke-linecap="round"/>
    <rect x="84" y="62" width="34" height="24" rx="12" fill="var(--success-tint)" stroke="var(--success)" stroke-width="3"/>
    <rect x="202" y="62" width="34" height="24" rx="12" fill="var(--success-tint)" stroke="var(--success)" stroke-width="3"/>
    <rect x="143" y="122" width="34" height="22" rx="11" fill="var(--success-tint)" stroke="var(--success)" stroke-width="3"/>
  `),
  circuits: frame(`
    ${gridLines()}
    <path d="M60 50 H260 V150 H60 Z" fill="none" stroke="var(--ink)" stroke-width="4" stroke-linejoin="round"/>
    <rect x="44" y="84" width="32" height="10" fill="var(--ink)"/><rect x="50" y="102" width="20" height="10" fill="var(--ink)"/>
    <rect x="44" y="80" width="32" height="40" fill="var(--cc-soft)" opacity="0"/>
    <path d="M130 50 l8 -12 l12 24 l12 -24 l12 24 l12 -24 l8 12" fill="none" stroke="var(--coral)" stroke-width="4" stroke-linejoin="round" transform="translate(0,0)"/>
    <circle cx="200" cy="150" r="22" fill="var(--amber)"/>
    <path d="M186 150 q7 -14 14 0 t14 0" stroke="var(--ink)" stroke-width="3" fill="none"/>
    <circle cx="200" cy="150" r="34" fill="none" stroke="var(--amber)" stroke-opacity=".4" stroke-width="6"/>
  `),
  probability: frame(`
    ${gridLines()}
    <rect x="60" y="60" width="72" height="72" rx="14" fill="var(--card)" stroke="var(--ink)" stroke-width="3" transform="rotate(-12 96 96)"/>
    <circle cx="80" cy="80" r="6" fill="var(--ink)"/><circle cx="96" cy="96" r="6" fill="var(--ink)"/><circle cx="112" cy="112" r="6" fill="var(--ink)"/>
    <circle cx="200" cy="90" r="34" fill="var(--amber)"/><circle cx="200" cy="90" r="24" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="3"/>
    ${[0, 1, 2, 3, 4, 5, 6].map((i) => { const hgt = [10, 26, 48, 60, 48, 26, 10][i]; return `<rect x="${150 + i * 18}" y="${185 - hgt}" width="14" height="${hgt}" rx="3" fill="var(--blue)"/>`; }).join('')}
  `),
  gravity: frame(`
    <rect width="320" height="200" fill="var(--night)"/>
    ${Array.from({ length: 30 }, (_, i) => `<circle cx="${(i * 97) % 320}" cy="${(i * 53) % 200}" r="${i % 3 ? 1 : 1.6}" fill="#fff" opacity=".6"/>`).join('')}
    <ellipse cx="160" cy="100" rx="120" ry="60" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="2" stroke-dasharray="4 6"/>
    <circle cx="160" cy="100" r="26" fill="var(--amber)"/>
    <circle cx="270" cy="76" r="10" fill="var(--blue)"/>
    <circle cx="70" cy="136" r="7" fill="var(--coral)"/>
  `, 'var(--night)'),
  vectors: frame(`
    ${gridLines()}
    <path d="M60 160 L180 120" stroke="var(--blue)" stroke-width="5" stroke-linecap="round"/><path d="M190 117 l-14 -5 l4 13 z" fill="var(--blue)"/>
    <path d="M180 120 L240 40" stroke="var(--coral)" stroke-width="5" stroke-linecap="round"/><path d="M246 32 l-13 4 l9 9 z" fill="var(--coral)"/>
    <path d="M60 160 L240 40" stroke="var(--teal)" stroke-width="5" stroke-dasharray="10 8" stroke-linecap="round"/>
    <circle cx="60" cy="160" r="7" fill="var(--ink)"/>
  `),
  default: frame(gridLines()),
};

export function cover(key) {
  return covers[key] || covers.default;
}

export const heroArt = `<svg viewBox="0 0 520 470" aria-hidden="true">
  <defs>
    <pattern id="hgrid" width="26" height="26" patternUnits="userSpaceOnUse"><path d="M26 0H0V26" fill="none" stroke="var(--grid)" stroke-width="1.2"/></pattern>
  </defs>
  <rect width="520" height="470" fill="url(#hgrid)"/>
  <!-- axes -->
  <path d="M40 400 H490 M60 430 V40" stroke="var(--axis)" stroke-width="2" opacity=".6"/>
  <!-- polynomial curve, animated by animateHero(): parabola, cubic, quartic, quintic -->
  <path class="ha-trace ha-curve" pathLength="1" d="M60 400 Q 250 -40 440 400" fill="none" stroke="var(--coral)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
  <!-- sine wave -->
  <path d="M40 330 C 80 290, 100 290, 140 330 S 200 370, 240 330 S 300 290, 340 330 S 400 370, 440 330 S 480 290, 500 300" fill="none" stroke="var(--blue)" stroke-width="4" opacity=".55" stroke-linecap="round"/>
  <!-- orbit -->
  <g transform="translate(395 120)">
    <ellipse rx="70" ry="70" fill="none" stroke="var(--ink)" stroke-opacity=".25" stroke-width="2" stroke-dasharray="3 7"/>
    <circle r="20" fill="var(--amber)"/>
    <g class="ha-spin"><circle cx="70" cy="0" r="9" fill="var(--blue)"/></g>
  </g>
  <!-- floating shapes -->
  <g class="ha-float"><rect x="110" y="70" width="64" height="64" rx="12" fill="var(--blue)"/><text x="142" y="113" text-anchor="middle" font-family="Newsreader, serif" font-style="italic" font-size="36" fill="#fff">x</text></g>
  <g class="ha-float d1"><path d="M222 118 L258 58 L294 118 Z" fill="var(--teal)"/></g>
  <!-- tangent line at t = 0.7 on the parabola: point (326,215.2), direction (380,352) -->
  <g class="ha-tangent">
    <path class="ha-tan-line" d="M250 144.8 L402 285.6" stroke="var(--ink)" stroke-width="3" stroke-linecap="round" opacity=".75"/>
    <g class="ha-tan-dot" transform="translate(326 215.2)"><circle r="10" fill="var(--coral)" class="ha-pulse"/><circle r="10" fill="var(--coral)" stroke="var(--card)" stroke-width="3"/></g>
  </g>
</svg>`;

// Hero curve: v in [-1, 1] maps to x = 60..440; f(v) is the height in px above the axis (y = 400).
// Each shape is a polynomial, and so is every blend of two of them during a morph.
const T5 = (v) => 16 * v ** 5 - 20 * v ** 3 + 5 * v;
const heroShapes = [
  { f: (v) => 220 * (1 - v * v), d: (v) => -440 * v }, // parabola
  { f: (v) => 110 + 300 * (v - v ** 3), d: (v) => 300 * (1 - 3 * v * v) }, // cubic
  { f: (v) => 800 * v * v * (1 - v * v), d: (v) => 1600 * v - 3200 * v ** 3 }, // quartic
  { f: (v) => 110 + 95 * T5(v), d: (v) => 95 * (80 * v ** 4 - 60 * v * v + 5) }, // quintic
];
const HOLD = 4.6, MORPH = 2.4, DRAW = 2.4, SAMPLES = 96, TAN_LEN = 200;
const ease = (s) => (s < 0.5 ? 4 * s ** 3 : 1 - (-2 * s + 2) ** 3 / 2);
const px = (v) => 250 + 190 * v;
const py = (h) => 400 - h;

export function animateHero(host) {
  const curve = host.querySelector('.ha-curve');
  const tangent = host.querySelector('.ha-tangent');
  const line = host.querySelector('.ha-tan-line');
  const dot = host.querySelector('.ha-tan-dot');
  if (!curve || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const frame = (t) => {
    const n = heroShapes.length, period = HOLD + MORPH;
    const k = Math.floor(t / period), local = t - k * period;
    const a = heroShapes[k % n], b = heroShapes[(k + 1) % n];
    const s = local < HOLD ? 0 : ease((local - HOLD) / MORPH);
    const f = (v) => (1 - s) * a.f(v) + s * b.f(v);
    const df = (v) => (1 - s) * a.d(v) + s * b.d(v);

    let d = '';
    for (let i = 0; i <= SAMPLES; i++) {
      const v = -1 + (2 * i) / SAMPLES;
      d += `${i ? 'L' : 'M'}${px(v).toFixed(1)} ${py(f(v)).toFixed(1)}`;
    }
    curve.setAttribute('d', d);

    // the point of tangency glides back and forth; it starts at v = 0.4 like the static art
    const v0 = 0.62 * Math.sin(2 * Math.PI * (t / 10) + Math.asin(0.4 / 0.62));
    const x0 = px(v0), y0 = py(f(v0));
    const slope = -df(v0) / 190; // dy/dx in screen pixels
    const len = Math.hypot(1, slope), ux = (TAN_LEN / 2) / len, uy = (slope * TAN_LEN / 2) / len;
    line.setAttribute('d', `M${(x0 - ux).toFixed(1)} ${(y0 - uy).toFixed(1)} L${(x0 + ux).toFixed(1)} ${(y0 + uy).toFixed(1)}`);
    dot.setAttribute('transform', `translate(${x0.toFixed(1)} ${y0.toFixed(1)})`);
    tangent.style.opacity = Math.min(1, Math.max(0, (t - DRAW + 0.4) / 0.6));
  };

  let start = null;
  const tick = (now) => {
    if (!host.isConnected) return;
    if (start === null) start = now;
    frame((now - start) / 1000);
    requestAnimationFrame(tick);
  };
  frame(0);
  requestAnimationFrame(tick);
}

export const principleArt = {
  doing: `<svg viewBox="0 0 300 120" aria-hidden="true">
    <path d="M30 80 H270" stroke="var(--line-2)" stroke-width="8" stroke-linecap="round"/>
    <path d="M30 80 H180" stroke="var(--blue)" stroke-width="8" stroke-linecap="round"/>
    <circle cx="180" cy="80" r="16" fill="var(--card)" stroke="var(--blue)" stroke-width="5" class="ha-pulse"/>
    <path d="M186 96 l10 22 l5 -9 l10 -1 z" fill="var(--ink)" transform="translate(0,-14)"/>
    <text x="30" y="44" font-family="Newsreader, serif" font-style="italic" font-size="26" fill="var(--ink)">y = 2x + 1</text>
  </svg>`,
  feedback: `<svg viewBox="0 0 300 120" aria-hidden="true">
    <rect x="30" y="22" width="240" height="34" rx="12" fill="var(--success-tint)" stroke="var(--success)" stroke-width="2.5"/>
    <circle cx="52" cy="39" r="10" fill="var(--success)"/><path d="M47 39 l4 4 l7 -8" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <rect x="72" y="34" width="120" height="10" rx="5" fill="var(--success)" opacity=".5"/>
    <rect x="30" y="68" width="240" height="34" rx="12" fill="var(--error-tint)" stroke="var(--error)" stroke-width="2.5"/>
    <circle cx="52" cy="85" r="10" fill="var(--error)"/><path d="M48 81 l8 8 M56 81 l-8 8" stroke="#fff" stroke-width="2.5"/>
    <rect x="72" y="80" width="160" height="10" rx="5" fill="var(--error)" opacity=".45"/>
  </svg>`,
  visual: `<svg viewBox="0 0 300 120" aria-hidden="true">
    <path d="M40 100 L120 100 L40 30 Z" fill="var(--card)" stroke="var(--ink)" stroke-width="3"/>
    <rect x="40" y="100" width="80" height="16" fill="var(--coral)" opacity=".8"/>
    <rect x="22" y="30" width="18" height="70" fill="var(--blue)" opacity=".8"/>
    <text x="150" y="58" font-family="Newsreader, serif" font-style="italic" font-size="24" fill="var(--ink)">a² + b² = c²</text>
    <path d="M150 80 h110" stroke="var(--teal)" stroke-width="5" stroke-linecap="round"/>
  </svg>`,
  streak: `<svg viewBox="0 0 300 120" aria-hidden="true">
    ${[0, 1, 2, 3, 4, 5, 6].map((i) => `<circle cx="${45 + i * 35}" cy="62" r="14" fill="${i < 5 ? '#ff8a3d' : 'var(--line-2)'}"/>`).join('')}
    ${[0, 1, 2, 3, 4].map((i) => `<path transform="translate(${37 + i * 35} 52) scale(.7)" d="M12 22c4.4 0 7-2.9 7-6.6 0-3.1-1.7-5.4-3.6-7.4-.4 1.6-1.3 2.8-2.6 3.4.3-3.3-1-6.4-3.8-8.4.1 2.9-1.4 4.8-3 6.6C4.6 11.2 5 12.9 5 15.4 5 19.1 7.6 22 12 22z" fill="#fff"/>`).join('')}
    <text x="150" y="108" text-anchor="middle" font-weight="800" font-size="14" fill="var(--ink-3)" letter-spacing="2">5 DAY STREAK</text>
  </svg>`,
};
