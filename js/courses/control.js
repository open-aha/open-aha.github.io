import { fix, sig } from '../lib/svg.js';

const r = String.raw;
const FS = (px) => `font-size:max(calc(${px}px * var(--fs, 1)), var(--fmin, 0px))`;
const D = Math.PI / 180;

// Simulations are run once per setting and cached; curves read them by interpolation.
const cache = new Map();
function memo(key, fn) {
  if (!cache.has(key)) { if (cache.size > 400) cache.clear(); cache.set(key, fn()); }
  return cache.get(key);
}
// sample a recorded series [{t, ...}] at time t
function at(series, t, k) {
  const dt = series.dt, i = Math.min(series.v.length - 1, Math.max(0, Math.floor(t / dt)));
  const j = Math.min(series.v.length - 1, i + 1), f = Math.min(1, Math.max(0, t / dt - i));
  return series.v[i][k] * (1 - f) + series.v[j][k] * f;
}

// ---------- a heated room: C dT/dt = P − k (T − Tout), time in minutes ----------
const ROOM = { C: 5, k: 0.1 };
function room({ P = 1.5, Tout = 5, T0 = 10, mode = 'fixed', set = 20, band = 0.5, Pon = 3, Kp = 0, tEnd = 240, change = null }) {
  return memo(`room|${P}|${Tout}|${T0}|${mode}|${set}|${band}|${Pon}|${Kp}|${tEnd}|${change}`, () => {
    const dt = 0.05, v = [];
    let T = T0, on = mode === 'thermostat' ? T0 < set : false, switches = on ? 1 : 0, warm = false, lo = 99, hi = -99;
    for (let t = 0; t <= tEnd + 1e-9; t += dt) {
      const out = change && t >= change[0] ? change[1] : Tout;
      let power = P;
      if (mode === 'thermostat') {
        if (on && T > set + band) on = false;
        else if (!on && T < set - band) { on = true; switches++; }
        power = on ? Pon : 0;
      } else if (mode === 'prop') power = Math.max(0, Kp * (set - T));
      if (T >= set) warm = true;
      if (warm) { lo = Math.min(lo, T); hi = Math.max(hi, T); }
      v.push({ T, on: on ? 1 : 0, P: power });
      T += (dt * (power - ROOM.k * (T - out))) / ROOM.C;
    }
    return { dt, v, switches, lo, hi };
  });
}

// ---------- cruise control on a 5% hill (starts at t = 0); speeds in m/s, shown in km/h ----------
function cruise(Kp, Ki = 0, T = 90) {
  return memo(`cruise|${Kp}|${Ki}`, () => {
    const m = 1000, b = 50, Fh = 490, vs = 25, u0 = 1250, dt = 0.02, v = [];
    let sp = 25, I = 0, dip = 0, over = 0;
    for (let t = 0; t <= T + 1e-9; t += dt) {
      v.push({ v: sp * 3.6 });
      const e = vs - sp;
      I += e * dt;
      const u = u0 + Kp * e + Ki * I;
      sp += (dt * (u - b * sp - Fh)) / m;
      dip = Math.max(dip, (vs - sp) * 3.6);
      over = Math.max(over, (sp - vs) * 3.6);
    }
    return { dt, v, dip, over, errAt: (t) => 90 - at({ dt, v }, t, 'v') };
  });
}

// ---------- a lag with a dead time (the shower): x' = −x + u(t − d), u = K (1 − x) ----------
function delayed(K, d) {
  return memo(`delay|${K}|${d}`, () => {
    const dt = 0.01, n = 3000, lag = Math.round(d / dt), x = new Float64Array(n + 1), u = new Float64Array(n + 1), v = [];
    for (let i = 0; i <= n; i++) {
      v.push({ x: x[i] });
      if (i === n) break;
      u[i] = K * (1 - x[i]);
      x[i + 1] = x[i] + dt * (-x[i] + (i - lag >= 0 ? u[i - lag] : 0));
    }
    const ss = K / (1 + K), pk = [];
    for (let i = 1; i < n; i++) if (x[i] > x[i - 1] && x[i] >= x[i + 1]) pk.push(x[i] - ss);
    const ratio = pk.length > 3 ? pk[3] / pk[2] : 0;
    return { dt, v, ratio, ss };
  });
}

// ---------- a hovering drone: z'' = Kp (10 − z) − Kd z' ----------
function drone(Kp, Kd) {
  return memo(`drone|${Kp}|${Kd}`, () => {
    const dt = 0.005, v = [];
    let z = 0, w = 0, peak = 0, t95 = null;
    for (let t = 0; t <= 10 + 1e-9; t += dt) {
      v.push({ z });
      peak = Math.max(peak, z);
      if (t95 == null && z >= 9.5) t95 = t;
      const a = Kp * (10 - z) - Kd * w;
      w += a * dt;
      z += w * dt;
    }
    return { dt, v, over: Math.max(0, peak - 10), t95 };
  });
}

// ---------- balancing a stick: θ'' = (g − Kp) θ / L − Kd θ' / L, L = 1 m, start at 10° ----------
function stick(Kp, Kd) {
  return memo(`stick|${Kp}|${Kd}`, () => {
    const dt = 0.002, v = [];
    let th = 10 * D, w = 0, maxAbs = 0;
    for (let t = 0; t <= 5 + 1e-9; t += dt) {
      v.push({ th: th / D });
      maxAbs = Math.max(maxAbs, Math.abs(th / D));
      const a = (9.8 - Kp) * th - Kd * w;
      w += a * dt;
      th += w * dt;
      if (Math.abs(th) > Math.PI / 2) th = Math.sign(th) * Math.PI / 2;
    }
    return { dt, v, maxAbs, end: Math.abs(v[Math.round(3 / dt)].th) };
  });
}
// a small cart-and-stick picture drawn inside a plot (centre bottom at px, py)
function stickPic(s, px, py, deg, cls = 'st-violet') {
  const L = 48, a = deg * D;
  return [
    s('rect', { x: px - 26, y: py - 14, width: 52, height: 18, rx: 5, class: 'fl-ink', opacity: 0.8 }),
    s('circle', { cx: px - 14, cy: py + 6, r: 5, class: 'fl-ink' }),
    s('circle', { cx: px + 14, cy: py + 6, r: 5, class: 'fl-ink' }),
    s('line', { x1: px, y1: py - 14, x2: px + L * Math.sin(a), y2: py - 14 - L * Math.cos(a), class: cls, 'stroke-width': 6, 'stroke-linecap': 'round' }),
    s('circle', { cx: px + L * Math.sin(a), cy: py - 14 - L * Math.cos(a), r: 7, class: 'fl-violet' }),
  ];
}

// a steam engine with a flyball governor: when it speeds up, the balls swing out and close the steam valve
const GOV = (() => {
  const dt = 0.01, T = 16, out = [];
  let w = 1 + 0.1 / 3; // steady speed for the light load
  const load = (t) => (t < 4 ? 0.6 : t < 10 ? 0.9 : 0.6);
  for (let i = 0; i <= T / dt; i++) {
    const t = i * dt, valve = Math.max(0, Math.min(1, 0.5 - 3 * (w - 1)));
    out.push({ t, w, valve, load: load(t) });
    w += ((1.5 * valve - load(t)) / 1.5) * dt;
  }
  return { dt, out };
})();

export default {
  id: 'control',
  subject: 'physics',
  title: 'Feedback & Control',
  level: 'Intermediate',
  cover: 'control',
  tagline: 'Thermostats, cruise control, wobbly showers, hovering drones and balancing sticks.',
  description: r`Measure, compare, correct, repeat: feedback is how thermostats hold a temperature, cars hold a speed, drones hover and your body stays at 37 °C. Simulate heaters and cars, discover why too much correction makes things oscillate, and tune the three ingredients of the PID controller that runs much of the modern world.`,
  prereq: 'Forces & Newton’s Laws',
  chapters: [
    {
      title: 'Closing the Loop',
      summary: 'Measuring and correcting.',
      lessons: [
        {
          id: 'loops',
          title: 'Open and Closed Loops',
          summary: 'Why measure at all?',
          icon: 'reset',
          steps: [
            {
              type: 'explain',
              title: 'Two kinds of control',
              body: r`A toaster runs for a fixed time, whether the bread is thick or thin, fresh or frozen. That's **open-loop** control: the action is decided in advance, and nothing checks the result.

A thermostat is different. It **measures** the temperature, **compares** it with the temperature you asked for (the **setpoint**), and switches the heating to **correct** the difference (the **error**). Then it measures again. The information flows round in a circle: a **closed loop**, or **feedback** control.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'A heater with no thermostat',
              body: r`A room loses heat to the outside, faster the warmer it is inside. A heater gives a fixed power $P$, with nothing checking the result. Change the power and the weather.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 240, ymin: -10, ymax: 35, grid: false, height: 300, axes: { xlabel: 'time (minutes)', ylabel: 'room (°C)', xticks: 60, yticks: 10, yAt: -10 },
                params: {
                  P: { min: 0, max: 3, step: 0.1, value: 1, label: 'heater', color: 'coral', format: (v) => `${fix(v, 1)} kW` },
                  out: { min: -10, max: 15, step: 1, value: 5, label: 'outside', color: 'blue', format: (v) => `${v} °C` },
                },
                curves: [{ f: () => 20, color: 'muted', dash: true }, { f: (x, p) => at(room({ P: p.P, Tout: p.out }), x, 'T'), color: 'coral', width: 3 }],
                readout: (p) => `the room settles at **${fix(p.out + p.P / ROOM.k, 1)} °C**`,
              },
              after: r`The room warms until it loses heat exactly as fast as the heater supplies it: $P = k(T - T_{\text{out}})$, so it settles at $T = T_{\text{out}} + \frac{P}{k}$, here with $k = 0.1$ kW per °C. Notice the dashed line, 20 °C, plays no part: the heater has no idea what temperature you want.`,
            },
            {
              type: 'interactive',
              title: 'Set it by hand',
              prompt: r`It's 5 °C outside. Choose the heater power so that the room settles at **20 °C**.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 240, ymin: 0, ymax: 30, grid: false, height: 280, axes: { xlabel: 'time (minutes)', ylabel: 'room (°C)', xticks: 60, yticks: 10 },
                params: { P: { min: 0, max: 3, step: 0.1, value: 0.8, label: 'heater', color: 'coral', format: (v) => `${fix(v, 1)} kW` } },
                curves: [{ f: () => 20, color: 'muted', dash: true }, { f: (x, p) => at(room({ P: p.P }), x, 'T'), color: 'coral', width: 3 }],
                readout: (p) => `settles at **${fix(5 + p.P / ROOM.k, 1)} °C**`,
                goal: (p) => Math.abs(p.P - 1.5) < 1e-9,
                solution: { P: 1.5 },
                hint: r`At 20 °C the room loses $0.1 \times (20 - 5)$ kW.`,
              },
              explain: r`At 20 °C the room loses $0.1 \times 15 = 1.5$ kW, so the heater must supply exactly 1.5 kW. Open-loop control can work, but only if you know the system perfectly and nothing changes.`,
            },
            {
              type: 'numeric',
              title: 'A cold night',
              prompt: r`The heater is left at 1.5 kW, but overnight the outside temperature falls from 5 °C to $-5$ °C. What temperature does the room settle at?`,
              unit: '°C',
              answer: 10,
              wrong: [{ v: 20, why: 'Nothing adjusts the heater: it keeps giving 1.5 kW, which now holds the room only 15 degrees above the colder outside.' }, { v: 5, why: r`The room settles $\frac{P}{k} = 15$ degrees above the outside temperature.` }],
              explain: r`$T = -5 + \frac{1.5}{0.1} = 10$ °C. The open-loop heater can't notice the room getting colder. A **disturbance** (the weather) ruined the result, and that's the main reason to close the loop.`,
            },
            {
              type: 'multi',
              title: 'Spot the feedback',
              prompt: 'Which of these use feedback (closed-loop control)?',
              choices: [
                { t: 'A car’s cruise control holding 100 km/h up and down hills', ok: true },
                { t: 'A microwave running for 2 minutes', why: 'It doesn’t measure the food; it just runs for the time you set.' },
                { t: 'A toilet cistern’s float valve', ok: true },
                { t: 'You steering a bike to stay on a path', ok: true },
                { t: 'A washing machine following its fixed programme', why: 'Most steps run on timers. (Some newer machines do measure the load or water level.)' },
              ],
              explain: r`Cruise control measures speed, the float measures the water level, and you watch the path: each compares a measurement with a goal and corrects. Feedback is so natural to living things that we rarely notice we're doing it.`,
            },
            { /*anim:control*/
              type: 'explain',
              kicker: 'Explore',
              title: 'Watt’s governor',
              body: r`One of the first feedback controllers: James Watt's flyball governor (1788). Two heavy balls spin with the engine. The faster they spin, the further they fly out, and the linkage closes the steam valve. Watch what happens when the mill suddenly asks for more work at 4 s, and less at 10 s.`,
              widget: {
                kind: 'graph', xmin: -4.2, xmax: 16.3, ymin: -0.5, ymax: 5.3, grid: false, axes: false, height: 300,
                animate: { param: 't', speed: 1.2, max: 17, autoplay: true },
                extra: ({ plot, p, s }) => {
                  const k = Math.min(GOV.out.length - 1, Math.floor(Math.min(16, p.t) / GOV.dt)), st = GOV.out[k], els = [];
                  // the governor: spindle, arms at an angle that grows with speed
                  const th = (40 + 400 * (st.w - 1)) * (Math.PI / 180), top = [-2, 4.6], L = 2.2, spin = Math.cos(st.t * 9);
                  els.push(s('line', { x1: plot.X(-2), y1: plot.Y(0.8), x2: plot.X(-2), y2: plot.Y(4.9), stroke: 'var(--ink)', 'stroke-width': 4 }));
                  for (const side of [-1, 1]) {
                    const bx = top[0] + side * L * Math.sin(th) * spin, by = top[1] - L * Math.cos(th);
                    els.push(s('line', { x1: plot.X(top[0]), y1: plot.Y(top[1]), x2: plot.X(bx), y2: plot.Y(by), stroke: 'var(--ink-2)', 'stroke-width': 3 }));
                    els.push(s('circle', { cx: plot.X(bx), cy: plot.Y(by), r: 13, class: 'fl-amber', stroke: 'var(--ink)', 'stroke-width': 1.5 }));
                  }
                  els.push(s('rect', { x: plot.X(-3.6), y: plot.Y(0.75), width: plot.X(3.2) - plot.X(0), height: plot.Y(0) - plot.Y(0.5), rx: 4, class: 'fl-surface', stroke: 'var(--ink-3)' }));
                  els.push(s('rect', { x: plot.X(-3.6), y: plot.Y(0.75), width: (plot.X(3.2) - plot.X(0)) * st.valve, height: plot.Y(0) - plot.Y(0.5), rx: 4, class: 'fl-teal' }));
                  els.push(s('text', { x: plot.X(-2), y: plot.Y(-0.25) + 4, 'text-anchor': 'middle', class: 'halo-text', style: 'font-size:max(calc(12px * var(--fs, 1)), var(--fmin, 0px));fill:var(--ink-3)', text: 'steam valve' }));
                  // chart: speed (and load) against time
                  const X = (t) => plot.X(0.8 + (t / 16) * 15.2), Y = (v) => plot.Y(2.6 + (v - 1) * 25);
                  els.push(s('line', { x1: X(0), x2: X(16), y1: Y(1), y2: Y(1), stroke: 'var(--ink-3)', 'stroke-width': 1, 'stroke-dasharray': '4 5' }));
                  els.push(s('text', { x: X(16), y: Y(1) - 6, 'text-anchor': 'end', class: 'halo-text', style: 'font-size:max(calc(12px * var(--fs, 1)), var(--fmin, 0px));fill:var(--ink-3)', text: 'target speed' }));
                  const pts = GOV.out.filter((o, i) => o.t <= st.t && i % 4 === 0);
                  els.push(s('path', { d: pts.map((o, i) => `${i ? 'L' : 'M'}${X(o.t).toFixed(1)} ${Y(o.w).toFixed(1)}`).join(''), fill: 'none', stroke: 'var(--blue)', 'stroke-width': 3 }));
                  els.push(s('path', { d: pts.map((o, i) => `${i ? 'L' : 'M'}${X(o.t).toFixed(1)} ${(plot.Y(0.6) - o.load * 60).toFixed(1)}`).join(''), fill: 'none', stroke: 'var(--coral)', 'stroke-width': 2 }));
                  els.push(s('text', { x: X(0.2), y: plot.Y(0.6) - 0.6 * 60 - 8, class: 'halo-text', style: 'font-size:max(calc(12px * var(--fs, 1)), var(--fmin, 0px));fill:var(--coral)', text: 'load' }));
                  return els;
                },
                readout: (p) => { const k = Math.min(GOV.out.length - 1, Math.floor(Math.min(16, p.t) / GOV.dt)), st = GOV.out[k]; return `engine speed ${fix(100 * st.w, 1)}% of target · valve ${fix(100 * st.valve, 0)}% open · load ${st.load === 0.9 ? 'heavy' : 'light'}`; },
              },
              after: r`When the load jumps, the engine slows, the balls drop, the valve opens wider, and the speed recovers: no person needed. But look closely: the speed settles **slightly** below target under the heavy load and slightly above under the light one. The valve can only stay wider open if the balls stay lower, which needs a lower speed. That small permanent error is typical of purely proportional control.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'The price of feedback',
              prompt: 'Feedback fixes the cold-night problem. What does it need that open-loop control doesn’t?',
              choices: [
                { t: 'A sensor to measure the result, and a rule for turning the error into an action', ok: true },
                { t: 'A more powerful heater', why: 'The power needed is the same. What’s new is measuring and reacting.' },
                { t: 'An exact model of the room and the weather', why: 'That’s what open-loop control needs! Feedback works even when the model is rough, because it keeps correcting.' },
              ],
              explain: r`A feedback controller needs a **sensor** and a **control law**: what to do about a given error. Choosing that law well is the whole art of control engineering, and the rest of this course explores the main options: on–off, proportional, integral and derivative.`,
            },
          ],
          recap: [
            'Open loop acts blindly; closed loop measures, compares and corrects.',
            'Error = setpoint − measurement.',
            'Feedback copes with disturbances that open-loop control can’t see.',
          ],
        },
        {
          id: 'onoff',
          title: 'On or Off',
          summary: 'The thermostat',
          icon: 'flame',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Switching around the setpoint',
              body: r`The simplest feedback is **on–off**: heater on if too cold, off if too warm. To stop it flickering on and off every second, a thermostat uses a **band** (hysteresis): it switches on below $20 - b$ and off above $20 + b$. Change the band.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 120, ymin: 15, ymax: 24, grid: false, height: 300, axes: { xlabel: 'time (minutes)', ylabel: 'room (°C)', xticks: 30, yticks: 1, yAt: 15 },
                params: { b: { min: 0.1, max: 2, step: 0.1, value: 0.5, label: 'band $b$', color: 'violet', format: (v) => `± ${fix(v, 1)} °C` } },
                under: ({ plot, p, s }) => {
                  const rm = room({ mode: 'thermostat', band: p.b, T0: 17, tEnd: 120 }), els = [];
                  let start = null;
                  rm.v.forEach((q, i) => {
                    const t = i * rm.dt;
                    if (q.on && start == null) start = t;
                    if ((!q.on || i === rm.v.length - 1) && start != null) { els.push(s('rect', { x: plot.X(start), y: plot.Y(24), width: plot.X(t) - plot.X(start), height: plot.Y(15) - plot.Y(24), class: 'fl-coral', opacity: 0.12 })); start = null; }
                  });
                  return els;
                },
                curves: [{ f: (x, p) => 20 + p.b, color: 'muted', dash: true }, { f: (x, p) => 20 - p.b, color: 'muted', dash: true }, { f: (x, p) => at(room({ mode: 'thermostat', band: p.b, T0: 17, tEnd: 120 }), x, 'T'), color: 'coral', width: 3, n: 600 }],
                readout: (p) => { const rm = room({ mode: 'thermostat', band: p.b, T0: 17, tEnd: 120 }); return `heater switched on **${rm.switches}** times in 2 hours (shaded) · room swings between ${fix(rm.lo, 1)} and ${fix(rm.hi, 1)} °C`; },
              },
              after: r`A narrow band holds the temperature tightly but switches very often, which wears out boilers and relays. A wide band switches rarely but lets the temperature wander. Every on–off controller trades accuracy against wear.`,
            },
            {
              type: 'interactive',
              title: 'Comfort with less wear',
              prompt: r`Keep the room between **19 °C and 21 °C** once it has warmed up, while switching the heater on **as few times as possible**.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 120, ymin: 15, ymax: 24, grid: false, height: 280, axes: { xlabel: 'time (minutes)', ylabel: 'room (°C)', xticks: 30, yticks: 1, yAt: 15 },
                params: { b: { min: 0.1, max: 2, step: 0.1, value: 0.3, label: 'band $b$', color: 'violet', format: (v) => `± ${fix(v, 1)} °C` } },
                under: ({ plot, s }) => [s('rect', { x: plot.X(0), y: plot.Y(21), width: plot.X(120) - plot.X(0), height: plot.Y(19) - plot.Y(21), class: 'fl-green', opacity: 0.1 })],
                curves: [{ f: (x, p) => at(room({ mode: 'thermostat', band: p.b, T0: 17, tEnd: 120 }), x, 'T'), color: 'coral', width: 3, n: 600 }],
                readout: (p) => { const rm = room({ mode: 'thermostat', band: p.b, T0: 17, tEnd: 120 }); return `switched on **${rm.switches}** times · range ${fix(rm.lo, 1)}–${fix(rm.hi, 1)} °C`; },
                goal: (p) => {
                  const rm = room({ mode: 'thermostat', band: p.b, T0: 17, tEnd: 120 });
                  if (rm.lo < 19 - 0.05 || rm.hi > 21 + 0.05) return { ok: false, msg: 'The temperature leaves the comfortable 19–21 °C range.' };
                  return Math.abs(p.b - 1) < 1e-9 ? true : { ok: false, msg: 'Comfortable, but the heater could switch less often. Widen the band as far as comfort allows.' };
                },
                solution: { b: 1 },
              },
              explain: r`A band of $\pm 1$ °C uses the whole comfort range, so the heater switches as rarely as possible. Each cycle takes longer when the band is wider: here about 13 minutes per degree of band.`,
            },
            {
              type: 'numeric',
              title: 'How long per cycle?',
              prompt: r`With the heater on, a room warms at 0.3 °C per minute; with it off, it cools at 0.3 °C per minute. With a band of $\pm 1.5$ °C, how long is one full on-and-off cycle?`,
              unit: 'minutes',
              answer: 20,
              wrong: [{ v: 10, why: 'That’s just the heating half. The cooling half takes as long again.' }, { v: 5, why: 'The temperature travels the full band, 3 °C, each way.' }],
              explain: r`The temperature climbs the full 3 °C band (10 minutes) and falls back (another 10): a 20-minute cycle. Doubling the band doubles the cycle time and halves the number of switch-ons.`,
            },
            {
              type: 'mcq',
              title: 'Why not a band of zero?',
              prompt: 'A thermostat with no band at all switches the heater on at 19.99 °C and off at 20.01 °C. What goes wrong?',
              choices: [
                { t: 'It switches on and off extremely often, especially with any noise in the sensor', ok: true },
                { t: 'The room overheats', why: 'It switches off almost immediately above 20 °C, so it can’t overheat.' },
                { t: 'The heater never turns on', why: 'It turns on whenever the room is even slightly too cold.' },
              ],
              explain: r`With no band, tiny wobbles in the reading make the switch **chatter**, flipping on and off many times a minute. The band (hysteresis) means "don't change your mind until the error is clearly the other way". The same trick appears in digital electronics, in Schmitt triggers that clean up noisy signals.`,
            },
            {
              type: 'mcq',
              title: 'Turning it up to max',
              prompt: 'A cold house: someone sets the thermostat to 30 °C, hoping to warm the room to 20 °C faster, planning to turn it back later. Does it help?',
              choices: [
                { t: 'No: an on–off heater is fully on until it reaches the setpoint either way', ok: true },
                { t: 'Yes: a higher setting makes the heater work harder', why: 'An on–off heater has only one power level: on. The setting only decides when it switches off.' },
              ],
              explain: r`Below the setpoint, the heater is simply on, at full power, whether the setpoint is 20 or 30 °C. A higher setting just makes it overshoot later (if you forget to turn it back). Proportional controllers, next, behave differently: the bigger the error, the harder they push.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Heating up',
              prompt: r`A room at 12 °C has a thermostat set to 20 °C with a band of $\pm 0.5$ °C. The heater warms it by 0.4 °C per minute. How long until the heater first switches **off**?`,
              unit: 'minutes',
              answer: 21.25,
              tol: 0.05,
              wrong: [{ v: 20, why: 'It switches off at the top of the band, 20.5 °C, not at 20 °C.' }, { v: 18.75, tol: 0.05, why: 'That’s the bottom of the band. It stays on until the room passes 20.5 °C.' }],
              explain: r`The heater stays on until the room passes $20 + 0.5 = 20.5$ °C: a rise of $8.5$ °C at 0.4 °C per minute, $21.25$ minutes. (Real rooms warm more slowly as they approach the outside heat-loss balance, but the idea is the same.)`,
            },
          ],
          recap: [
            'On–off control switches fully on or off around the setpoint.',
            'A band (hysteresis) prevents chattering.',
            'Wider band: fewer switches, bigger swings.',
          ],
        },
      ],
    },
    {
      title: 'Proportional Control',
      summary: 'Pushing harder for bigger errors.',
      lessons: [
        {
          id: 'proportional',
          title: 'Proportional Control',
          summary: 'Cruise control on a hill',
          icon: 'right',
          steps: [
            {
              type: 'explain',
              title: 'The bigger the error, the harder the push',
              body: r`Instead of full-on or off, a **proportional** controller sets its effort in proportion to the error:
$$u = K_p \times \text{error}$$
The constant $K_p$ is the **gain**. Small error, gentle correction; big error, big correction. Car cruise control works like this: the further below the set speed, the more throttle.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Up the hill',
              body: r`A car cruises at 90 km/h on the flat with just enough throttle to hold that speed. At time 0 it reaches a 5% uphill slope. The controller adds extra engine force $K_p \times$ (speed error). Change the gain.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 60, ymin: 80, ymax: 92, grid: false, height: 300, axes: { xlabel: 'time (s)', ylabel: 'speed (km/h)', xticks: 10, yticks: 2, yAt: 80 },
                params: { K: { min: 0, max: 3000, step: 50, value: 200, label: '$K_p$', color: 'violet', format: (v) => `${v} N per m/s` } },
                curves: [{ f: () => 90, color: 'muted', dash: true }, { f: (x, p) => at(cruise(p.K), x, 'v'), color: 'blue', width: 3 }],
                readout: (p) => `steady speed on the hill: **${fix(90 - (490 / (p.K + 50)) * 3.6, 1)} km/h** (error ${fix((490 / (p.K + 50)) * 3.6, 1)} km/h)`,
              },
              after: r`Without control ($K_p = 0$) the car slows until drag balances the hill. With a proportional controller it settles closer to 90 km/h, but **never quite reaches it**. Some error is needed for the controller to push at all: the extra force needed to climb the hill is $K_p \times$ error, so the error can't be zero. This leftover is the **steady-state error**.`,
            },
            {
              type: 'interactive',
              title: 'Within 2 km/h',
              prompt: r`Choose a gain that keeps the car within **2 km/h** of 90 km/h on the hill once it has settled.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 60, ymin: 80, ymax: 92, grid: false, height: 280, axes: { xlabel: 'time (s)', ylabel: 'speed (km/h)', xticks: 10, yticks: 2, yAt: 80 },
                params: { K: { min: 0, max: 3000, step: 50, value: 200, label: '$K_p$', color: 'violet', format: (v) => `${v} N per m/s` } },
                under: ({ plot, s }) => [s('rect', { x: plot.X(0), y: plot.Y(92), width: plot.X(60) - plot.X(0), height: plot.Y(88) - plot.Y(92), class: 'fl-green', opacity: 0.1 })],
                curves: [{ f: (x, p) => at(cruise(p.K), x, 'v'), color: 'blue', width: 3 }],
                readout: (p) => `steady error: **${fix((490 / (p.K + 50)) * 3.6, 2)} km/h**`,
                goal: (p) => (490 / (p.K + 50)) * 3.6 <= 2,
                solution: { K: 850 },
                hint: r`The steady error is $\frac{490}{K_p + 50}$ m/s (the hill's force divided by the gain plus the drag factor). 2 km/h is 0.56 m/s.`,
              },
              explain: r`The error shrinks as the gain grows: $\frac{490}{K_p + 50}$ m/s. Any gain from about 850 upwards keeps it under 2 km/h. Higher gain means smaller error, but as you'll see next, a gain that is too high can bring its own trouble.`,
            },
            {
              type: 'numeric',
              title: 'A proportional heater',
              prompt: r`A heater's power is $P = K(20 - T)$ kW, with $K = 0.9$ kW per °C. The room loses $0.1(T - 5)$ kW to the outside. At what temperature does the room settle? (Where heating equals loss.)`,
              unit: '°C',
              answer: 18.5,
              tol: 0.01,
              wrong: [{ v: 20, why: 'At exactly 20 °C the heater would give no power at all, so the room would cool. It settles a little below.' }, { v: 5, why: 'That’s the outside temperature. The heater keeps the room far above it.' }],
              hint: r`Solve $0.9(20 - T) = 0.1(T - 5)$.`,
              explain: r`$18 - 0.9T = 0.1T - 0.5$ gives $T = 18.5$ °C: a steady-state error of 1.5 °C. Increase $K$ tenfold and the error falls about tenfold, but never to zero.`,
            },
            {
              type: 'mcq',
              title: 'Gain versus error',
              prompt: 'What happens to the steady-state error of a proportional controller as the gain is increased?',
              choices: [
                { t: 'It gets smaller but never reaches zero', ok: true },
                { t: 'It disappears completely once the gain is large enough', why: 'The controller needs a non-zero error to produce any effort, so some error always remains.' },
                { t: 'It grows, because the controller over-reacts', why: 'Over-reacting causes overshoot and oscillation, but the steady error itself shrinks as the gain rises.' },
              ],
              explain: r`The error is roughly (the effort needed) ÷ (gain). Doubling the gain halves it. To get rid of it entirely, the controller needs a way to keep pushing even with zero error: that's the job of the **integral** term, two lessons on.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'A heavier load',
              prompt: r`On a steeper hill the car needs an extra 980 N (twice as much). With $K_p = 930$ N per m/s and drag factor 50, what is the steady speed error in km/h? (1 decimal place.)`,
              unit: 'km/h',
              answer: (980 / 980) * 3.6,
              tol: 0.06,
              wrong: [{ v: 1, why: 'That’s the error in m/s. Multiply by 3.6 for km/h.' }, { v: 1.8, tol: 0.06, why: 'The hill force doubled, so the error doubles too (for the same gain).' }],
              explain: r`Error $= \frac{980}{930 + 50} = 1$ m/s $= 3.6$ km/h. Twice the disturbance, twice the error: proportional control shrinks disturbances by a fixed factor but can't cancel them.`,
            },
          ],
          recap: [
            'Proportional control: effort = gain × error.',
            'It leaves a steady-state error ≈ needed effort ÷ gain.',
            'Higher gain, smaller error, but never zero.',
          ],
        },
        {
          id: 'gain',
          title: 'Too Much Gain',
          summary: 'Delays and oscillation',
          icon: 'bolt',
          steps: [
            {
              type: 'explain',
              title: 'The shower problem',
              body: r`In an unfamiliar shower, the water is cold, so you turn the tap towards hot. Nothing happens for a few seconds (the hot water is still in the pipe), so you turn it more. Suddenly it's scalding; you turn it hard towards cold... and the cycle repeats.

The problem is **delay**: your corrections take effect only after a while. Reacting strongly to an error that you've already corrected (but can't feel yet) makes you **overshoot**.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Gain and delay',
              body: r`A system responds with a lag and a **dead time** $d$ before any correction arrives. A proportional controller pushes with gain $K$ towards a target of 1. Raise the gain, and the delay.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 30, ymin: -0.5, ymax: 2, grid: false, height: 300, axes: { xlabel: 'time (s)', ylabel: 'output', xticks: 5, yticks: 0.5, yAt: -0.5 },
                params: {
                  K: { min: 0.5, max: 3, step: 0.05, value: 1.5, label: 'gain $K$', color: 'violet', format: (v) => fix(v, 2) },
                  d: { min: 0, max: 2, step: 0.1, value: 1, label: 'dead time $d$', color: 'amber', format: (v) => `${fix(v, 1)} s` },
                },
                curves: [{ f: () => 1, color: 'muted', dash: true }, { f: (x, p) => at(delayed(p.K, p.d), x, 'x'), color: 'blue', width: 3, n: 500 }],
                readout: (p) => { const q = delayed(p.K, p.d).ratio; return q === 0 ? 'no oscillation' : q < 0.97 ? `oscillation dies away (each swing ${fix(q, 2)}× the last)` : q <= 1.03 ? 'oscillation keeps going: **the edge of stability**' : `oscillation **grows** (each swing ${fix(q, 2)}× the last)`; },
              },
              after: r`With no dead time, raising the gain only speeds things up. With a delay, high gain makes the output overshoot, oscillate, and above a critical gain, swing more wildly each time: the loop is **unstable**. The longer the delay, the lower the gain you can safely use.`,
            },
            {
              type: 'interactive',
              title: 'The edge of stability',
              prompt: r`With a dead time of 1 s, find the **critical gain**: the gain at which the oscillation neither grows nor dies away.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 30, ymin: -0.5, ymax: 2, grid: false, height: 280, axes: { xlabel: 'time (s)', ylabel: 'output', xticks: 5, yticks: 0.5, yAt: -0.5 },
                params: { K: { min: 0.5, max: 3, step: 0.05, value: 1, label: 'gain $K$', color: 'violet', format: (v) => fix(v, 2) } },
                curves: [{ f: () => 1, color: 'muted', dash: true }, { f: (x, p) => at(delayed(p.K, 1), x, 'x'), color: 'blue', width: 3, n: 500 }],
                readout: (p) => { const q = delayed(p.K, 1).ratio; return `each swing is **${fix(q, 2)}×** the one before`; },
                goal: (p) => Math.abs(delayed(p.K, 1).ratio - 1) < 0.03,
                solution: { K: 2.25 },
                hint: 'Below the critical gain, swings shrink; above it, they grow. Look for the gain where they stay the same size.',
              },
              explain: r`About $K = 2.25$. Engineers measure this **ultimate gain** (and the period of the steady oscillation) on real systems, then set the working gain to a safe fraction of it, often about half. This recipe, from John Ziegler and Nathaniel Nichols in 1942, is still used to tune controllers in factories.`,
            },
            {
              type: 'mcq',
              title: 'Taming the shower',
              prompt: 'What’s the best strategy in a shower with a long delay?',
              choices: [
                { t: 'Make small adjustments and wait for each one to take effect', ok: true },
                { t: 'Turn the tap quickly and further, to beat the delay', why: 'Bigger, faster corrections are exactly what makes a delayed loop overshoot.' },
                { t: 'Keep turning the tap until the temperature changes', why: 'By the time it changes, you’ve turned far too much: the classic overshoot.' },
              ],
              explain: r`Lower gain (small adjustments) and patience (waiting about one delay time) keep a delayed loop stable. Central banks face the same problem: interest-rate changes take a year or more to affect inflation, so they move in small steps.`,
            },
            {
              type: 'numeric',
              title: 'How long is the delay?',
              prompt: r`Hot water travels from the boiler to the shower head through 6 m of pipe at 1.5 m/s. How long is the dead time between turning the tap and feeling the change?`,
              unit: 's',
              answer: 4,
              wrong: [{ v: 9, why: 'Time = distance ÷ speed, not distance × speed.' }, { v: 0.25, why: 'That’s speed ÷ distance. Divide the distance by the speed.' }],
              explain: r`$6 \div 1.5 = 4$ s. Any correction you make now arrives 4 seconds later. A loop with this delay needs gentle, patient control.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Faster sensors',
              prompt: 'A factory replaces a slow temperature sensor (which takes 30 s to respond) with a fast one (1 s). How does this change the controller design?',
              choices: [
                { t: 'A higher gain becomes safe, giving faster and more accurate control', ok: true },
                { t: 'Nothing: sensor speed doesn’t affect stability', why: 'A slow sensor adds delay to the loop, and delay is what limits the gain.' },
                { t: 'The gain must be lowered to avoid over-reacting to the faster readings', why: 'Faster readings mean the controller sees its corrections sooner, which allows stronger action, not weaker.' },
              ],
              explain: r`Every delay in the loop, whether in the process, the actuator or the sensor, lowers the critical gain. Removing delay is often the best way to improve a control system: it lets you turn the gain up without oscillation.`,
            },
          ],
          recap: [
            'Delays make feedback overshoot and oscillate.',
            'Above the critical gain, oscillations grow: the loop is unstable.',
            'Longer delays force gentler control.',
          ],
        },
      ],
    },
    {
      title: 'PID',
      summary: 'Integral, derivative and balance.',
      lessons: [
        {
          id: 'integral',
          title: 'Integral Action',
          summary: 'Wiping out the leftover error',
          icon: 'sigma',
          steps: [
            {
              type: 'explain',
              title: 'Remembering the past',
              body: r`Proportional control left the car slightly too slow on the hill forever. An **integral** term fixes this by adding up the error over time:
$$u = K_p\, e + K_i \int e\, dt$$
As long as any error remains, the integral keeps growing, pushing harder and harder. It only stops changing when the error is exactly zero. So at steady state, the integral term supplies the extra effort, and the error vanishes.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Back to 90',
              body: r`The same car and hill, with $K_p = 200$. Add integral action.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 90, ymin: 80, ymax: 92, grid: false, height: 300, axes: { xlabel: 'time (s)', ylabel: 'speed (km/h)', xticks: 15, yticks: 2, yAt: 80 },
                params: { Ki: { min: 0, max: 300, step: 10, value: 10, label: '$K_i$', color: 'teal' } },
                curves: [{ f: () => 90, color: 'muted', dash: true }, { f: (x) => at(cruise(200, 0), x, 'v'), color: 'muted', width: 2 }, { f: (x, p) => at(cruise(200, p.Ki), x, 'v'), color: 'blue', width: 3 }],
                readout: (p) => { const c = cruise(200, p.Ki); return `largest dip ${fix(c.dip, 1)} km/h · overshoot ${fix(c.over, 2)} km/h · error after 60 s: ${fix(Math.abs(c.errAt(60)), 2)} km/h`; },
              },
              after: r`The grey curve is proportional control alone, stuck 7 km/h below. With a little integral action the speed creeps back to exactly 90. Too much, and the speed overshoots: the integral has built up so much push that it carries the car past the setpoint before it unwinds.`,
            },
            {
              type: 'interactive',
              title: 'Quick but no overshoot',
              prompt: r`Choose $K_i$ so that the error is under **0.1 km/h** after 60 s, while the speed never overshoots 90 km/h by more than **0.1 km/h**.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 90, ymin: 80, ymax: 92, grid: false, height: 280, axes: { xlabel: 'time (s)', ylabel: 'speed (km/h)', xticks: 15, yticks: 2, yAt: 80 },
                params: { Ki: { min: 0, max: 300, step: 10, value: 100, label: '$K_i$', color: 'teal' } },
                curves: [{ f: () => 90, color: 'muted', dash: true }, { f: (x, p) => at(cruise(200, p.Ki), x, 'v'), color: 'blue', width: 3 }],
                readout: (p) => { const c = cruise(200, p.Ki); return `overshoot **${fix(c.over, 2)}** km/h · error after 60 s **${fix(Math.abs(c.errAt(60)), 2)}** km/h`; },
                goal: (p) => { const c = cruise(200, p.Ki); return c.over <= 0.1 && Math.abs(c.errAt(60)) < 0.1; },
                solution: { Ki: 20 },
                hint: 'Too little integral action is slow; too much overshoots. Try values between 10 and 40.',
              },
              explain: r`$K_i = 20$ brings the speed back within about a minute without overshooting. Integral action trades speed against overshoot, much as proportional gain trades accuracy against oscillation.`,
            },
            {
              type: 'numeric',
              title: 'Adding up the error',
              prompt: r`An error of 2 units lasts for 5 seconds (and is zero before that). With $K_i = 3$, how much effort does the integral term contribute after those 5 seconds?`,
              answer: 30,
              wrong: [{ v: 6, why: 'That’s Kᵢ × error. The integral adds up the error over time first: 2 × 5.' }, { v: 10, why: 'That’s the integral of the error. Multiply by Kᵢ = 3.' }],
              explain: r`$\int e\,dt = 2 \times 5 = 10$ (the area under the error), and $K_i \times 10 = 30$. Even if the error then dropped to zero, the integral term would **keep** contributing 30: it remembers.`,
            },
            {
              type: 'mcq',
              title: 'Integral windup',
              prompt: 'A cruise-controlled car climbs a very long, steep hill at full throttle, unable to reach the set speed for a minute. At the top, the road levels. What can go wrong?',
              choices: [
                { t: 'The integral has built up a huge value, so the car speeds well past the setpoint before it unwinds', ok: true },
                { t: 'The integral resets to zero at the top', why: 'Nothing resets it: it holds everything it has accumulated.' },
                { t: 'The car stops accelerating at the top', why: 'Quite the opposite: the stored integral keeps demanding effort.' },
              ],
              explain: r`While the engine was maxed out, the error stayed large and the integral kept growing ("winding up"). Once the car can respond, all that stored push sends it far past the setpoint. Real controllers use **anti-windup**: they stop integrating while the actuator is at its limit.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'What the integral holds',
              prompt: r`At steady state on the hill, the car holds exactly 90 km/h, so the error and the proportional term are zero. The hill needs an extra 490 N. If $K_i = 20$, what is the value of the integral $\int e\,dt$ (in m/s × s)?`,
              unit: 'm',
              answer: 24.5,
              tol: 0.01,
              wrong: [{ v: 490, why: 'That’s the force the integral term must supply. Divide by Kᵢ to get the integral itself.' }, { v: 9800, why: 'Divide the force by Kᵢ, don’t multiply.' }],
              explain: r`$K_i \int e\,dt = 490$ N, so $\int e\,dt = \frac{490}{20} = 24.5$ m. (Error in m/s times seconds is metres: it's literally how far the car has "fallen behind" a car driving exactly at 90 km/h.) The integral stores exactly the effort needed to cancel the disturbance.`,
            },
          ],
          recap: [
            'The integral term adds up error over time and removes steady-state error.',
            'Too much integral action causes overshoot.',
            'Windup: the integral can grow too large while the actuator is maxed out.',
          ],
        },
        {
          id: 'derivative',
          title: 'Derivative & PID',
          summary: 'Damping a hovering drone',
          icon: 'up',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'A bouncing drone',
              body: r`A drone hovers at ground level and is told to climb to 10 m. Its controller sets the upward acceleration to $K_p(10 - z)$ (after cancelling gravity), with $K_p = 4$. Add **derivative** action, which opposes the vertical speed: $-K_d\,\dot z$.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 20, grid: false, height: 300, axes: { xlabel: 'time (s)', ylabel: 'height (m)', xticks: 2, yticks: 5 },
                params: { Kd: { min: 0, max: 8, step: 0.5, value: 0, label: '$K_d$', color: 'pink', format: (v) => fix(v, 1) } },
                curves: [{ f: () => 10, color: 'muted', dash: true }, { f: (x, p) => at(drone(4, p.Kd), x, 'z'), color: 'blue', width: 3 }],
                readout: (p) => { const q = drone(4, p.Kd); return `overshoot **${fix(q.over, 2)} m** · reaches 9.5 m after ${q.t95 == null ? 'never' : fix(q.t95, 2) + ' s'}`; },
              },
              after: r`With proportional control alone ($K_d = 0$), the drone bounces up and down forever: by the time it reaches 10 m it's moving fast, and nothing slows it down. The derivative term acts like a shock absorber: it brakes in proportion to the speed, **anticipating** the overshoot before it happens.`,
            },
            {
              type: 'interactive',
              title: 'Critical damping',
              prompt: r`Find the derivative gain that brings the drone up to 10 m **as fast as possible without any overshoot**.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 14, grid: false, height: 280, axes: { xlabel: 'time (s)', ylabel: 'height (m)', xticks: 2, yticks: 2 },
                params: { Kd: { min: 0, max: 8, step: 0.5, value: 1, label: '$K_d$', color: 'pink', format: (v) => fix(v, 1) } },
                curves: [{ f: () => 10, color: 'muted', dash: true }, { f: (x, p) => at(drone(4, p.Kd), x, 'z'), color: 'blue', width: 3 }],
                readout: (p) => { const q = drone(4, p.Kd); return `overshoot **${fix(q.over, 3)} m** · reaches 9.5 m after ${q.t95 == null ? 'more than 10 s' : fix(q.t95, 2) + ' s'}`; },
                goal: (p) => { const q = drone(4, p.Kd); if (q.over > 1e-3) return { ok: false, msg: 'It still overshoots 10 m: add more damping.' }; return Math.abs(p.Kd - 4) < 1e-9 ? true : { ok: false, msg: 'No overshoot, but it climbs more slowly than it could. Use less damping.' }; },
                solution: { Kd: 4 },
                hint: r`For $\ddot z = K_p(10 - z) - K_d\dot z$, the boundary between bouncing and creeping is $K_d = 2\sqrt{K_p}$.`,
              },
              explain: r`$K_d = 2\sqrt{K_p} = 2\sqrt4 = 4$: **critical damping**, the fastest response with no overshoot. Less damping bounces (underdamped); more damping creeps (overdamped). Car suspensions, door closers and measuring needles are all designed near this sweet spot.`,
            },
            {
              type: 'numeric',
              title: 'A stiffer controller',
              prompt: r`If the drone's proportional gain is raised to $K_p = 9$, what derivative gain gives critical damping?`,
              answer: 6,
              wrong: [{ v: 18, why: r`Critical damping is $2\sqrt{K_p}$, not $2K_p$.` }, { v: 3, why: r`That's $\sqrt{K_p}$. Double it.` }],
              explain: r`$K_d = 2\sqrt9 = 6$. A higher $K_p$ makes the drone respond faster, and it then needs more damping too, growing like the square root of $K_p$, to avoid bouncing.`,
            },
            {
              type: 'explain',
              title: 'PID',
              body: r`Put all three together and you get the **PID controller**, the workhorse of engineering:
$$u = K_p\,e + K_i \int e\,dt + K_d \frac{de}{dt}$$
- **P** reacts to the present error.
- **I** remembers the past, removing steady-state error.
- **D** anticipates the future, damping overshoot.

PID loops run in thermostats, cruise control, drones, hard-drive heads, chemical plants and power stations: probably billions of them, mostly tuned by adjusting just these three numbers.`,
            },
            {
              type: 'mcq',
              title: 'A noisy sensor',
              prompt: 'A temperature sensor’s reading jitters randomly by ±0.1 °C every fraction of a second. Which PID term is most upset by this noise?',
              choices: [
                { t: 'The derivative term', ok: true },
                { t: 'The integral term', why: 'Adding up noise over time mostly averages it out. The integral is the least sensitive to jitter.' },
                { t: 'The proportional term', why: 'P passes the jitter through at its own size, but D amplifies it.' },
              ],
              explain: r`Derivative action responds to how fast the reading changes, and random jitter changes very fast, so the D term turns small noise into large, jerky corrections. Engineers filter (smooth) the signal before differentiating, or use little or no D on noisy systems.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'How much bounce?',
              prompt: r`The **damping ratio** is $\zeta = \frac{K_d}{2\sqrt{K_p}}$ ($\zeta = 1$ is critical damping). For $\zeta < 1$, the overshoot as a percentage of the step is $100\,e^{-\pi\zeta/\sqrt{1 - \zeta^2}}$. What is the overshoot for $K_p = 16$, $K_d = 4$? (Nearest whole percent.)`,
              unit: '%',
              answer: 100 * Math.exp((-Math.PI * 0.5) / Math.sqrt(0.75)),
              tol: 0.6,
              wrong: [{ v: 50, why: r`$\zeta = 0.5$ is the damping ratio, not the overshoot. Put it into the formula.` }, { v: 0, why: r`$\zeta = \frac{4}{2 \times 4} = 0.5 < 1$, so it's underdamped: it overshoots.` }],
              explain: r`$\zeta = \frac{4}{2 \times 4} = 0.5$, so the overshoot is $100\,e^{-\pi(0.5)/\sqrt{0.75}} = 100\,e^{-1.81} \approx 16\%$: climbing to 10 m, the drone would rise to about 11.6 m. Many designs aim for $\zeta \approx 0.7$, about 5% overshoot, as a good compromise between speed and smoothness.`,
            },
          ],
          recap: [
            'Derivative action opposes motion, damping overshoot.',
            'Critical damping (K_d = 2√K_p here): fastest without overshoot.',
            'PID = present (P) + past (I) + future (D).',
          ],
        },
        {
          id: 'balance',
          title: 'Balancing Act',
          summary: 'Keeping a stick upright',
          icon: 'target',
          steps: [
            {
              type: 'explain',
              title: 'Unstable on its own',
              body: r`Balance a broom upright on your palm. Left alone, it falls: the further it tilts, the faster it tips. That's an **unstable** system, and only feedback can hold it up. You watch the top and move your hand underneath it.

For a stick of length $L$ tilted by a small angle $\theta$, gravity makes the tilt grow ($\ddot\theta \approx \frac{g}{L}\theta$), while accelerating your hand by $a$ pushes it back ($-\frac{a}{L}$). A PD controller moves the hand with $a = K_p\theta + K_d\dot\theta$.`,
            },
            {
              type: 'interactive',
              title: 'Keep it up',
              prompt: r`The 1 m stick starts tilted $10°$. Choose the gains so that it never tilts more than **12°**, and is upright to within **0.5°** after 3 seconds.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 5, ymin: -20, ymax: 20, grid: false, height: 300, axes: { xlabel: 'time (s)', ylabel: 'tilt (°)', xticks: 1, yticks: 5, xticksBelow: true, xlabelBelow: 'edge' },
                params: {
                  Kp: { min: 0, max: 40, step: 1, value: 8, label: '$K_p$', color: 'violet' },
                  Kd: { min: 0, max: 12, step: 0.5, value: 0, label: '$K_d$', color: 'pink', format: (v) => fix(v, 1) },
                },
                under: ({ plot, s }) => [s('rect', { x: plot.X(0), y: plot.Y(12), width: plot.X(5) - plot.X(0), height: plot.Y(-12) - plot.Y(12), class: 'fl-green', opacity: 0.08 })],
                curves: [{ f: (x, p) => at(stick(p.Kp, p.Kd), x, 'th'), color: 'blue', width: 3, n: 500 }],
                extra: ({ plot, p, s }) => stickPic(s, plot.X(3.9), plot.Y(-17), at(stick(p.Kp, p.Kd), 3, 'th')),
                readout: (p) => { const q = stick(p.Kp, p.Kd); return q.maxAbs >= 89 ? 'the stick **falls over**' : `largest tilt ${fix(q.maxAbs, 1)}° · tilt after 3 s: ${fix(q.end, 2)}° (pictured)`; },
                goal: (p) => { const q = stick(p.Kp, p.Kd); return q.maxAbs <= 12 && q.end < 0.5; },
                solution: { Kp: 20, Kd: 6 },
                hint: r`$K_p$ must beat gravity ($K_p > g \approx 9.8$), and $K_d$ damps the wobble.`,
              },
              explain: r`With $K_p < 9.8$ the hand can't beat gravity and the stick falls whatever $K_d$ is. With enough $K_p$ but no $K_d$, it wobbles back and forth forever. Something like $K_p = 20$, $K_d = 6$ catches it smoothly. Segways, self-balancing robots and rockets on landing all solve this problem many times a second.`,
            },
            {
              type: 'numeric',
              title: 'The minimum push',
              prompt: r`For the stick to be stable, the proportional gain must exceed $g$ (the hand must push harder than gravity tips). On the Moon ($g = 1.6$ m/s²), what is the minimum $K_p$?`,
              answer: 1.6,
              tol: 0.01,
              wrong: [{ v: 9.8, why: 'That’s for Earth. The Moon’s gravity tips the stick far more gently.' }],
              explain: r`$K_p > 1.6$. Weaker gravity means slower falling and gentler balancing: on the Moon a stick tips over about $\sqrt{9.8 / 1.6} \approx 2.5$ times more slowly than on Earth, giving you far more time to react.`,
            },
            {
              type: 'numeric',
              title: 'Broom or pencil?',
              prompt: r`A stick's falling speeds up with the time scale $\sqrt{L/g}$: a shorter stick falls faster. How many times longer is that time scale for a 1.5 m broom than for a 15 cm pencil? (1 decimal place.)`,
              answer: Math.sqrt(10),
              tol: 0.06,
              wrong: [{ v: 10, why: r`Ten times longer stick, but the time goes as the **square root** of the length.` }, { v: 0.3, tol: 0.05, why: 'The broom is the slower one: its time scale is longer, not shorter.' }],
              explain: r`$\sqrt{1.5/0.15} = \sqrt{10} \approx 3.2$. You have about three times as long to react to a broom as to a pencil, which is why a pencil is almost impossible to balance on a fingertip while a broom is easy.`,
            },
            {
              type: 'mcq',
              title: 'Rockets on their tails',
              prompt: 'Why does a rocket need active steering just to fly straight up?',
              choices: [
                { t: 'Its thrust pushes from below, like a hand under a balanced stick: any tilt grows unless corrected', ok: true },
                { t: 'Because of the Earth’s rotation', why: 'Rotation affects the path a little, but the main problem is balance.' },
                { t: 'Because the engine is not powerful enough', why: 'Power isn’t the issue: even a powerful engine tips the rocket over if the thrust isn’t kept aligned.' },
              ],
              explain: r`A rocket pushed from its tail is an inverted pendulum. Its control system swivels (gimbals) the engine many times a second to keep the thrust under the centre of mass. The reusable boosters that land upright perform exactly this balancing act on the way down.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'What if the hand is slow?',
              prompt: 'You try to balance a stick while your reactions are delayed by alcohol. Which stick becomes impossible first?',
              choices: [
                { t: 'The short one, because it falls on a shorter time scale than your delay', ok: true },
                { t: 'The long one, because it’s heavier', why: 'Mass doesn’t enter the falling time scale √(L/g); length does.' },
                { t: 'Both equally', why: 'The time scale √(L/g) is shorter for the short stick, so a fixed delay matters more for it.' },
              ],
              explain: r`Balancing fails when your reaction delay becomes comparable to the stick's falling time $\sqrt{L/g}$, exactly like the delayed shower going unstable. Delay plus an unstable system is the hardest combination in control, which is why fly-by-wire jets need very fast computers.`,
            },
          ],
          recap: [
            'An inverted pendulum is unstable: tilt grows unless corrected.',
            'PD control stabilises it if K_p beats gravity; K_d damps the wobble.',
            'Shorter sticks fall faster (time scale √(L/g)), so delays matter more.',
          ],
        },
        {
          id: 'nature',
          title: 'Feedback Everywhere',
          summary: 'Bodies, microphones and loop gain',
          icon: 'sparkle',
          steps: [
            {
              type: 'explain',
              title: 'Negative feedback keeps you alive',
              body: r`Your body is full of feedback loops. Too hot: you sweat and blood vessels in your skin widen to shed heat. Too cold: you shiver. Blood sugar too high: the pancreas releases insulin, which brings it down; too low: glucagon, which raises it.

These are **negative feedback** loops: the response **opposes** the change, pulling the body back towards its setpoint. Biologists call the result **homeostasis**. Every controller in this course so far used negative feedback.`,
            },
            {
              type: 'interactive',
              title: 'Loop gain',
              prompt: r`A signal goes round a loop (for example, from a speaker into a microphone and back out). Each trip multiplies it by the **loop gain** $g$. Set $g$ so that a whisper **neither grows nor fades**.`,
              widget: {
                kind: 'graph', xmin: -0.5, xmax: 20.5, ymin: 0, ymax: 4, grid: false, height: 280, axes: { xlabel: 'trips round the loop', ylabel: 'loudness', xticks: 5, yticks: 1, xAt: -0.5 },
                params: { g: { min: 0.5, max: 1.5, step: 0.05, value: 0.8, label: 'loop gain $g$', color: 'coral', format: (v) => fix(v, 2) } },
                extra: ({ plot, p, s }) => Array.from({ length: 21 }, (_, n) => { const v = Math.min(4, p.g ** n); return [s('line', { x1: plot.X(n), x2: plot.X(n), y1: plot.Y(0), y2: plot.Y(v), stroke: 'var(--coral)', 'stroke-width': 4, 'stroke-linecap': 'round' }), s('circle', { cx: plot.X(n), cy: plot.Y(v), r: 4, class: 'fl-coral' })]; }),
                readout: (p) => `after 20 trips: **${sig(p.g ** 20, 3, true)}** times the start`,
                goal: (p) => Math.abs(p.g - 1) < 1e-9,
                solution: { g: 1 },
              },
              explain: r`At $g = 1$ each trip returns exactly what went in. Below 1, the sound dies away; above 1, it grows each time round, which is the ear-splitting **howl** of a microphone held near its own speaker. Sound engineers turn the gain down or point microphones away from speakers to keep the loop gain below 1.`,
            },
            {
              type: 'numeric',
              title: 'Just above one',
              prompt: r`With a loop gain of 1.1, by what factor has a sound grown after 20 trips round the loop? (1 decimal place.)`,
              answer: 1.1 ** 20,
              tol: 0.06,
              wrong: [{ v: 3, why: 'That adds 10% twenty times. Gains multiply: 1.1 × 1.1 × … twenty times.' }, { v: 22, why: r`That's $1.1 \times 20$. The gain compounds: $1.1^{20}$.` }],
              explain: r`$1.1^{20} \approx 6.7$. A sound loop goes round hundreds of times per second, so even slightly over 1, a whisper becomes a howl almost instantly.`,
            },
            {
              type: 'multi',
              title: 'Positive feedback',
              prompt: 'In **positive** feedback, the response reinforces the change. Which of these are positive feedback?',
              choices: [
                { t: 'A microphone howling near its speaker', ok: true },
                { t: 'Melting sea ice exposing dark water, which absorbs more sunlight and melts more ice', ok: true },
                { t: 'Shivering when you’re cold', why: 'Shivering warms you, opposing the drop in temperature: negative feedback.' },
                { t: 'A bank run: worried customers withdraw money, which makes others more worried', ok: true },
                { t: 'A thermostat switching off the heating when the room is warm', why: 'That opposes the rise in temperature: negative feedback.' },
              ],
              explain: r`Positive feedback amplifies: howls, runaway ice melt, panics, avalanches. It isn't always bad: blood clotting and the contractions of childbirth use positive feedback to drive a process quickly to completion. But it needs a limit, or it runs away.`,
            },
            {
              type: 'mcq',
              title: 'A wiring mistake',
              prompt: 'An electrician wires a thermostat backwards: it turns the heater **on** when the room is too **warm**. What happens?',
              choices: [
                { t: 'The room heats up until the heater can’t go any hotter (or the room cools to the outside temperature): it runs away', ok: true },
                { t: 'The room holds the setpoint anyway, just less accurately', why: 'The correction now pushes the wrong way, so any error grows instead of shrinking.' },
                { t: 'The heater switches on and off rapidly', why: 'Once the room is warm the heater stays on and makes it warmer, so it never switches off.' },
              ],
              explain: r`Reversing the sign of a feedback loop turns negative feedback into positive: the controller now **amplifies** errors. A tiny bit too warm, heater on, warmer still... Getting the sign right is the first thing control engineers check.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Shrinking the error',
              prompt: r`A negative feedback loop corrects 30% of the remaining error every minute (so 70% of it remains). After how many whole minutes is the error first below **10%** of where it started?`,
              unit: 'minutes',
              answer: 7,
              wrong: [{ v: 3, why: r`Corrections compound: after 3 minutes, $0.7^3 \approx 34\%$ remains.` }, { v: 6, why: r`$0.7^6 \approx 0.118$: still just above 10%.` }],
              explain: r`$0.7^6 \approx 0.118$ and $0.7^7 \approx 0.082$, so after **7** minutes. Negative feedback with a constant fraction of correction makes the error decay exponentially, the same mathematics as radioactive decay and the room cooling at the start of the course.`,
            },
          ],
          recap: [
            'Negative feedback opposes change and keeps systems near a setpoint.',
            'Loop gain above 1 makes signals grow: howls and runaways.',
            'Positive feedback amplifies, sometimes usefully, but needs limits.',
          ],
        },
      ],
    },
  ],
};
