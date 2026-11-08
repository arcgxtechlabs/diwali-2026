/**
 * Per-frame simulation of gameplay entities. Called from the World's useFrame.
 * Moves foes, arrows, maces and marks; applies slow motion; then hands off to the director's tick().
 */
import { Vector3 } from 'three';
import { sim } from './sim';
import { gs } from '@/store/gameStore';
import { WORLD } from './world';
import { loseLamp, tick } from './director';
import { vfx, PALETTE } from '@/vfx/bus';
import { easeInOut } from '@/characters/rig';

const _v = new Vector3();
export function stepSim(raw: number) {
  raw = Math.min(0.05, raw); sim.raw = raw;
  sim.timeScale = sim.t < sim.slowUntil ? 0.28 : sim.timeScale + (1 - sim.timeScale) * Math.min(1, raw * 3);
  const dt = raw * sim.timeScale; sim.dt = dt; sim.t += dt;
  const scene = gs().scene;
  sim.scroll += dt * sim.speed;
  // Garuda bobbing, banking from recent shots and the hover state
  const g = sim.garuda;
  const rest = g.hover ? WORLD.garudaBattle : WORLD.garudaRide;
  g.bob = Math.sin(sim.t * 2.1) * 0.18 + Math.sin(sim.t * 3.7) * 0.06;
  g.pos.x += (rest.x + Math.sin(sim.t * 0.5) * 0.6 - g.pos.x) * Math.min(1, dt * 1.5);
  g.pos.y += (rest.y + g.bob - g.pos.y) * Math.min(1, dt * 2);
  g.pos.z += (rest.z - g.pos.z) * Math.min(1, dt * 1.2);
  const wantBank = scene === 'ride' ? Math.sin(sim.t * 0.5) * 0.2 : 0;
  g.bank += (wantBank - g.bank) * Math.min(1, dt * 2);
  g.pitch += ((g.hover ? 0.12 : -0.05) - g.pitch) * Math.min(1, dt * 2);
  // foes
  for (let i = sim.foes.length - 1; i >= 0; i--) {
    const f = sim.foes[i];
    if (f.dead) { if (sim.t - f.dying > 0.8) sim.foes.splice(i, 1); continue; }
    f.pos.addScaledVector(f.vel, dt);
    f.pos.x += Math.sin(sim.t * 1.7 + f.phase) * 2.2 * dt; f.pos.y += Math.cos(sim.t * 2.3 + f.phase) * 1.6 * dt + (g.pos.y - f.pos.y) * dt * 0.25;
    f.pos.x += (g.pos.x - f.pos.x) * dt * 0.12;
    if (f.pos.z > g.pos.z - 2.5) { sim.foes.splice(i, 1); if (scene === 'ride') loseLamp(f.pos); }
  }
  // maces: arc toward the target, dangerous when they arrive
  for (let i = sim.maces.length - 1; i >= 0; i--) {
    const m = sim.maces[i]; if (m.dead) { sim.maces.splice(i, 1); continue; }
    m.t += dt; const k = Math.min(1, m.t / m.dur), e = easeInOut(k);
    m.pos.lerpVectors(m.from, m.to, e); m.pos.y += Math.sin(k * Math.PI) * 5;
    if (k >= 1) { sim.maces.splice(i, 1); if (scene === 'battle' || scene === 'rage') loseLamp(m.to); }
  }
  // marks expire
  for (let i = sim.marks.length - 1; i >= 0; i--) { const m = sim.marks[i]; if (m.hit ? sim.t - m.hitT > 0.5 : sim.t - m.born > m.life) sim.marks.splice(i, 1); }
  // arrows
  for (let i = sim.arrows.length - 1; i >= 0; i--) {
    const a = sim.arrows[i]; a.t += dt; if (a.follow && !a.follow.dead) a.to.copy(a.follow.pos);
    const k = Math.min(1, a.t / a.dur), e = a.big ? k * k : k; a.pos.lerpVectors(a.from, a.to, e); if (!a.big) a.pos.y += Math.sin(k * Math.PI) * 0.6;
    if (a.big && Math.random() < 0.6) vfx.burst(a.pos, { kind: 'holy', count: 2, color: PALETTE.white, color2: PALETTE.flame, speed: 1.5, life: 0.8, size: 0.25 });
    if (a.t >= a.dur) { sim.arrows.splice(i, 1); a.onArrive?.(); }
  }
  // floating score labels
  for (let i = sim.floats.length - 1; i >= 0; i--) { const f = sim.floats[i]; f.t += raw; if (f.t > 1.2) sim.floats.splice(i, 1); }
  // boss timers
  sim.boss.hurt = Math.max(0, sim.boss.hurt - dt); sim.boss.swing = Math.max(0, 1 - (sim.t - sim.boss.swingAt) / 0.9);
  // camera shake decay
  sim.camera.shake *= Math.pow(0.02, raw); sim.camera.fovKick *= Math.pow(0.01, raw); sim.flash *= Math.pow(0.001, raw);
  tick(dt, raw);
}
export { _v as tmpVec };
