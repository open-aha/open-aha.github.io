import { graph } from './graph.js';
import { figure } from './figure.js';
import { balance } from './balance.js';
import { track } from './track.js';
import { projectile } from './projectile.js';
import { forces } from './forces.js';
import { energy } from './energy.js';
import { circuit } from './circuit.js';
import { sampler } from './sampler.js';
import { monty } from './monty.js';
import { orbit } from './orbit.js';
import { collide } from './collide.js';
import { sieve } from './sieve.js';
import { gas } from './gas.js';
import { doubleslit } from './doubleslit.js';
import { network } from './network.js';
import { decay } from './decay.js';
import { mandel } from './mandel.js';
import { julia } from './julia.js';
import { ipd } from './ipd.js';
import { bits } from './bits.js';
import { symmetry } from './symmetry.js';
import { gates } from './gates.js';
import { turing } from './turing.js';
import { pcp } from './pcp.js';
import { ising } from './ising.js';
import { robot } from './robot.js';
import { trace } from './trace.js';
import { reactor } from './reactor.js';
import { ensureDefs } from '../lib/svg.js';

const REGISTRY = { graph, figure, balance, track, projectile, forces, energy, circuit, sampler, monty, orbit, collide, sieve, gas, doubleslit, network, decay, mandel, julia, ipd, bits, symmetry, gates, turing, pcp, ising, robot, trace, reactor };

export function registerWidget(name, fn) {
  REGISTRY[name] = fn;
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
