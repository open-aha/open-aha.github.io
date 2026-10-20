import { ensureDefs } from '../lib/svg.js';

// Each widget is its own module, fetched the first time a lesson needs it.
const LOADERS = {
  graph: () => import('./graph.js'),
  figure: () => import('./figure.js'),
  balance: () => import('./balance.js'),
  track: () => import('./track.js'),
  projectile: () => import('./projectile.js'),
  forces: () => import('./forces.js'),
  energy: () => import('./energy.js'),
  circuit: () => import('./circuit.js'),
  sampler: () => import('./sampler.js'),
  monty: () => import('./monty.js'),
  orbit: () => import('./orbit.js'),
  collide: () => import('./collide.js'),
  sieve: () => import('./sieve.js'),
  gas: () => import('./gas.js'),
  doubleslit: () => import('./doubleslit.js'),
  network: () => import('./network.js'),
  decay: () => import('./decay.js'),
  mandel: () => import('./mandel.js'),
  julia: () => import('./julia.js'),
  ipd: () => import('./ipd.js'),
  bits: () => import('./bits.js'),
  symmetry: () => import('./symmetry.js'),
  gates: () => import('./gates.js'),
  turing: () => import('./turing.js'),
  pcp: () => import('./pcp.js'),
  ising: () => import('./ising.js'),
  robot: () => import('./robot.js'),
  trace: () => import('./trace.js'),
  reactor: () => import('./reactor.js'),
  mol: () => import('./mol.js'),
  mol3d: () => import('./mol3d.js'),
  fold: () => import('./fold.js'),
};
const REGISTRY = {};

export function registerWidget(name, fn) {
  REGISTRY[name] = fn;
}

// widget kinds used anywhere inside obj (a course, a lesson or a step)
function kindsIn(obj, out = new Set(), seen = new Set()) {
  if (!obj || typeof obj !== 'object' || seen.has(obj)) return out;
  seen.add(obj);
  if (typeof obj.kind === 'string' && Object.prototype.hasOwnProperty.call(LOADERS, obj.kind)) out.add(obj.kind);
  for (const v of Object.values(obj)) kindsIn(v, out, seen);
  return out;
}

// load every widget used inside obj, so createWidget can stay synchronous
export function loadWidgets(obj) {
  const kinds = [...kindsIn(obj)].filter((k) => !REGISTRY[k]);
  return Promise.all(kinds.map((k) => LOADERS[k]().then((m) => (REGISTRY[k] ||= m[k]))));
}

export function createWidget(box, spec, api) {
  ensureDefs();
  const fn = REGISTRY[spec.kind];
  if (!fn) {
    box.textContent = `Missing widget: ${spec.kind}`;
    return {};
  }
  return fn(box, spec, api) || {};
}
