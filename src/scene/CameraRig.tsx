/**
 * The camera director. Every frame it picks a target position/look-at/fov for the
 * current sim.camera.shot, eases toward it, then adds shake and fov kicks.
 * Shots are authored here so the whole film has one visual grammar.
 */
import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import { Vector3, PerspectiveCamera, MathUtils } from 'three';
import { sim, type CameraShot } from '@/game/sim';
import { WORLD } from '@/game/world';
import { gs } from '@/store/gameStore';
import { targeting } from '@/game/targeting';
import { easeInOut, smooth } from '@/characters/rig';

const _pos = new Vector3(), _look = new Vector3(), _g = new Vector3(), _b = new Vector3(), _arrow = new Vector3();
interface ShotResult { pos: Vector3; look: Vector3; fov: number; rate: number; roll?: number }

function shot(name: CameraShot, t: number, since: number, out: ShotResult, portrait: boolean): ShotResult {
  const g = _g.copy(sim.garuda.pos), boss = _b.copy(WORLD.bossPos); const wide = portrait ? 1.35 : 1;
  out.rate = 2.2; out.roll = 0; out.fov = 50 * wide;
  switch (name) {
    case 'intro': out.pos.set(Math.sin(t * 0.05) * 6, 12 + Math.sin(t * 0.08) * 1.5, 40); out.look.set(0, 4 + Math.sin(t * 0.07) * 2, -60); out.fov = 46 * wide; out.rate = 0.6; break;
    case 'title': { const k = Math.min(1, since / 9); out.pos.set(-18 + k * 30, 16 - k * 6, 30 - k * 20); out.look.set(0, 2, -80); out.fov = 42 * wide; out.rate = 0.5; break; }
    case 'prologue': { const k = smooth(Math.min(1, since / 14)); out.pos.set(10 - k * 6, 10 - k * 3, 20 - k * 10); out.look.set(0, 6 + k * 4, -40); out.fov = (40 - k * 6) * wide; out.rate = 0.7; break; }
    case 'mount': { const a = since * 0.25 - 0.8; const r = 5.5; out.pos.set(g.x + Math.sin(a) * r, g.y + 1.6 + Math.sin(since * 0.3) * 0.3, g.z + Math.cos(a) * r); out.look.copy(g).add(_arrow.set(0, 0.9, 0)); out.fov = 40 * wide; out.rate = 1.4; break; }
    case 'ride': { const sway = Math.sin(t * 0.7) * 0.5; out.pos.set(g.x + 2.4 + sway, g.y + 1.5, g.z + 7.5); out.look.set(g.x * 0.4, g.y + 0.2, g.z - 12); out.fov = 56 * wide; out.rate = 3; out.roll = -sim.garuda.bank * 0.5; break; }
    case 'gates': out.pos.set(g.x + 3.5, g.y + 0.6, g.z + 6.5); out.look.set(0, 2, -36); out.fov = 44 * wide; out.rate = 1.2; break;
    case 'bossEnter': { const k = smooth(Math.min(1, since / 4)); out.pos.set(-6 + k * 4, -0.5 + k * 1.2, -18 + k * 2); out.look.copy(boss).add(_arrow.set(0, 6.5 + k * 1.5, 0)); out.fov = (34 + k * 4) * wide; out.rate = 1.1; break; }
    case 'battle': { const sway = Math.sin(t * 0.4) * 0.4; out.pos.set(g.x + 2.6 + sway, g.y + 1.9, g.z + 6.5); out.look.copy(boss).add(_arrow.set(0, 5.6, 0)).lerp(g, 0.25); out.fov = 52 * wide; out.rate = 2.5; break; }
    case 'fall': { const k = easeInOut(Math.min(1, since / 2.5)); out.pos.set(g.x - 1.8 + k * 0.6, g.y + 1.4, g.z + 2.6 - k * 0.4); out.look.copy(g).add(_arrow.set(0, 0.7, -0.2)); out.fov = (36 - k * 6) * wide; out.rate = 2; break; }
    case 'rise': { const k = easeInOut(Math.min(1, since / 3)); out.pos.set(g.x - 2.6 + k * 0.4, g.y + 1.3 + k * 0.6, g.z + 3.2); out.look.copy(g).add(WORLD.satyaStandOffset).add(_arrow.set(0, 1.2, 0)); out.fov = (38 - k * 4) * wide; out.rate = 1.6; break; }
    case 'final': { const d = gs().finalDraw; out.pos.set(g.x + 1.3 - d * 0.5, g.y + 1.9 + d * 0.2, g.z + 3.4 - d * 1.2); out.look.copy(boss).add(_arrow.set(0, 6.3, 0)); out.fov = (48 - d * 18) * wide; out.rate = 3.5; break; }
    case 'arrow': { const a = sim.arrows.find((x) => x.big); if (a) { out.pos.copy(a.pos).add(_arrow.set(1.6, 0.9, 4.2)); out.look.copy(a.pos).add(_arrow.set(0, 0, -6)); } else { out.pos.copy(boss).add(_arrow.set(6, 8, 10)); out.look.copy(boss).add(_arrow.set(0, 6, 0)); } out.fov = 60 * wide; out.rate = 8; break; }
    case 'death': { const k = Math.min(1, since / 6); out.pos.set(boss.x + 14 - k * 4, boss.y + 5 + k * 4, boss.z + 22); out.look.copy(boss).add(_arrow.set(0, 5 - k * 2, 0)); out.fov = 44 * wide; out.rate = 0.9; break; }
    case 'dawn': { const k = smooth(Math.min(1, since / 14)); out.pos.set(g.x - 6 + k * 2, g.y + 3 + k * 14, g.z + 10 + k * 6); out.look.set(0, 2 + k * 2, -80); out.fov = (50 + k * 8) * wide; out.rate = 0.6; break; }
    case 'finale': out.pos.set(Math.sin(t * 0.08) * 3, 6 + Math.sin(t * 0.1), 18); out.look.set(0, 12, -60); out.fov = 58 * wide; out.rate = 0.5; break;
    case 'showcase': { const r = 4.5; out.pos.set(Math.sin(t * 0.35) * r, 1.6, Math.cos(t * 0.35) * r); out.look.set(0, 1.1, 0); out.fov = 38 * wide; out.rate = 20; break; }
  }
  return out;
}

export function CameraRig({ fixed }: { fixed?: { pos: [number, number, number]; look: [number, number, number]; fov?: number } }) {
  const { camera, size } = useThree();
  const res = useRef<ShotResult>({ pos: new Vector3(0, 10, 40), look: new Vector3(0, 4, -60), fov: 46, rate: 1 });
  const cur = useRef({ pos: new Vector3(0, 10, 40), look: new Vector3(0, 4, -60), fov: 46, init: false, seed: Math.random() * 100 });
  useFrame(() => {
    const cam = camera as PerspectiveCamera; const c = cur.current; const raw = sim.raw;
    let r: ShotResult;
    if (fixed) { r = res.current; r.pos.set(...fixed.pos); r.look.set(...fixed.look); r.fov = fixed.fov ?? 40; r.rate = 30; r.roll = 0; }
    else r = shot(sim.camera.shot, sim.t, sim.t - sim.camera.shotAt, res.current, size.height > size.width);
    if (!c.init) { c.pos.copy(r.pos); c.look.copy(r.look); c.fov = r.fov; c.init = true; }
    const k = 1 - Math.exp(-raw * r.rate);
    c.pos.lerp(r.pos, k); c.look.lerp(r.look, k); c.fov = MathUtils.lerp(c.fov, r.fov, k);
    // handheld drift + shake
    const t = sim.t + c.seed, sh = sim.camera.shake;
    const hx = Math.sin(t * 1.3) * 0.02 + Math.sin(t * 2.9) * 0.01, hy = Math.cos(t * 1.1) * 0.015;
    _pos.copy(c.pos); _pos.x += hx + (Math.random() - 0.5) * sh; _pos.y += hy + (Math.random() - 0.5) * sh; _pos.z += (Math.random() - 0.5) * sh * 0.5;
    _look.copy(c.look); _look.x += (Math.random() - 0.5) * sh * 2; _look.y += (Math.random() - 0.5) * sh * 2;
    cam.position.copy(_pos); cam.lookAt(_look); cam.rotateZ((r.roll || 0) + Math.sin(t * 0.9) * 0.004);
    const fov = c.fov + sim.camera.fovKick; if (Math.abs(cam.fov - fov) > 0.01) { cam.fov = fov; cam.updateProjectionMatrix(); }
    targeting.set(cam, size.width, size.height);
  });
  return null;
}
