/**
 * Screen-space targeting. The World registers the active camera and viewport here each frame;
 * the director uses it to turn pointer taps into world targets.
 */
import { Vector3, Vector2, type Camera, Ray, Plane } from 'three';
import type { Foe, Mace, Mark } from './types';
import { BOSS_HITBOXES } from './world';
import { sim } from './sim';
import { WORLD } from './world';

const _v = new Vector3(), _ray = new Ray(), _plane = new Plane(), _p = new Vector2();
class Targeting {
  camera: Camera | null = null; width = 1; height = 1; dpr = 1;
  set(camera: Camera, width: number, height: number) { this.camera = camera; this.width = width; this.height = height; }
  /** World -> CSS pixel coordinates. Returns z > 1 when behind the camera. */
  project(p: Vector3, out = new Vector3()) { if (!this.camera) return out.set(-1e9, -1e9, 2); out.copy(p).project(this.camera); out.x = (out.x + 1) / 2 * this.width; out.y = (1 - out.y) / 2 * this.height; return out; }
  /** CSS pixel -> world point on the plane z = planeZ. */
  unproject(px: number, py: number, planeZ: number, out = new Vector3()) {
    if (!this.camera) return out.set(0, 0, planeZ);
    _p.set((px / this.width) * 2 - 1, -(py / this.height) * 2 + 1);
    _v.set(_p.x, _p.y, 0.5).unproject(this.camera); _ray.origin.setFromMatrixPosition(this.camera.matrixWorld); _ray.direction.copy(_v).sub(_ray.origin).normalize();
    _plane.set(new Vector3(0, 0, 1), -planeZ); const hit = _ray.intersectPlane(_plane, out); if (!hit) out.copy(_ray.origin).addScaledVector(_ray.direction, 60); return out;
  }
  /** Apparent radius in CSS pixels of a sphere of world radius r at p. */
  pixelRadius(p: Vector3, r: number) { if (!this.camera) return 0; const d = _v.setFromMatrixPosition(this.camera.matrixWorld).distanceTo(p); const fov = ((this.camera as { fov?: number }).fov || 50) * Math.PI / 180; return (r / (d * Math.tan(fov / 2))) * (this.height / 2); }
  private nearest<T extends { pos: Vector3; r: number }>(px: number, py: number, items: T[], slackPx: number, skip: (i: T) => boolean) {
    let best: T | null = null, bd = 1e9;
    for (const it of items) { if (skip(it)) continue; const s = this.project(it.pos); if (s.z > 1) continue; const d = Math.hypot(s.x - px, s.y - py); const lim = this.pixelRadius(it.pos, it.r) + slackPx; if (d < lim && d < bd) { bd = d; best = it; } }
    return best;
  }
  pickFoe(px: number, py: number, foes: Foe[], slackPx = 48) { return this.nearest(px, py, foes, slackPx, (f) => f.dead); }
  pickMace(px: number, py: number, maces: Mace[], slackPx = 60) { return this.nearest(px, py, maces, slackPx, (m) => m.dead); }
  pickMark(px: number, py: number, marks: Mark[], slackPx = 56) {
    const items = marks.filter((m) => !m.hit).map((m) => ({ mark: m, pos: new Vector3(WORLD.bossPos.x + m.offset.x * sim.boss.scale, WORLD.bossPos.y + m.offset.y * sim.boss.scale, WORLD.bossPos.z + m.offset.z * sim.boss.scale), r: m.r * sim.boss.scale }));
    const hit = this.nearest(px, py, items, slackPx, () => false); return hit ? hit.mark : null;
  }
  pickBossBox(px: number, py: number, slackPx = 36) {
    const items = BOSS_HITBOXES.map((b) => ({ box: b, pos: new Vector3(WORLD.bossPos.x + b.offset[0] * sim.boss.scale, WORLD.bossPos.y + b.offset[1] * sim.boss.scale, WORLD.bossPos.z + b.offset[2] * sim.boss.scale), r: b.r * sim.boss.scale }));
    const hit = this.nearest(px, py, items, slackPx, () => false); return hit ? hit.box : null;
  }
}
export const targeting = new Targeting();
