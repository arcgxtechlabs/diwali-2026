/**
 * Set dressing for Pragjyotisha: pixel surface textures (24 px/m), building kit, diya atlas.
 * Colours follow the ladders in docs/VISUAL-STYLE.md §3.
 */
import { BoxGeometry, Color, CylinderGeometry, Group, Mesh, MeshStandardMaterial, SphereGeometry, Texture, InstancedMesh } from 'three';
import { PX, ramp, h2, fbm, texOf, pxMat, pxMesh, worldUV, PPM, type PxMat, FIRE_RAMP, hex } from './px';

/* ------------------------------------------------------------ textures */
/** Sandstone block wall, one jharokha window per 4 m tile. lit: 0 dark, 1 warm light, 2 fire-red glow. */
export function wallTex(seed: number, lit: 0 | 1 | 2, o: { cols?: string[] } = {}) {
  const W = 96, H = 96, P = new PX(W, H), E = new PX(W, H);
  const R = ramp(o.cols ?? ['#241a1e', '#3a2a2c', '#4e3a38', '#64504a', '#7a665c']), course = 12, blk = 24;
  const G = lit === 2 ? ramp(['#8a1a08', '#e0421a', '#ff8c2a', '#ffd35a']) : ramp(['#8a3e14', '#e0822c', '#ffc05a', '#ffe6a4']), F = ramp(['#160e10', '#2a1a1c', '#3c2a2a']);
  const wx0 = 36, wy0 = 22, ww = 24, wh = 34; // window opening
  P.fill((x, y) => {
    const inWin = x >= wx0 && x < wx0 + ww && y >= wy0 && y < wy0 + wh;
    if (inWin) {
      const lx = x - wx0, ly = y - wy0; const arch = ly < 7 && Math.hypot(lx - ww / 2, ly - 7) > ww / 2; // pointed-ish arch corners are wall
      if (arch) { /* wall */ } else {
        const frame = lx === 0 || lx === ww - 1 || ly === wh - 1 || (ly === 0) || (lx === 11 || lx === 12) || ly === 16 || (ly < 7 && Math.hypot(lx - ww / 2, ly - 7) > ww / 2 - 2.2);
        if (frame) return F(ly === wh - 1 ? 0.9 : 0.45 + h2(x, y, seed) * 0.3, x, y);
        if (lit === 0) return F(0.15 + h2(x, y, seed + 2) * 0.15, x, y);
        const v = 0.55 + (1 - ly / wh) * 0.25 + (h2(x, y, seed + 3) - 0.5) * 0.25 - (lx > 12 && ly > 17 ? 0.25 : 0); const c = G(v, x, y); E.set(x, y, c); return c;
      }
    }
    const row = Math.floor(y / course), yy = y % course, off = (row % 2) * (blk / 2), xx = (x + off) % blk, id = h2(Math.floor((x + off) / blk), row, seed);
    let v = 0.45 + id * 0.3 + (fbm(x * 0.2, y * 0.2, seed) - 0.5) * 0.35; if (yy === 0) v = 0.08; else if (yy === 1) v += 0.1; else if (yy === course - 1) v -= 0.15; if (xx === 0) v = 0.12;
    if (y > wy0 + wh + 2 && y < wy0 + wh + 5 && x > wx0 - 4 && x < wx0 + ww + 4) v = 0.72; // sill ledge
    if (h2(x, y, seed + 9) > 0.985) v -= 0.3;
    return R(v, x, y);
  });
  return { c: P.done(), e: E.done() };
}
/** Flat rooftop: plaster with a parapet border and a dark drain line. */
export function roofTex(seed: number) {
  const P = new PX(96, 96), R = ramp(['#3a2a22', '#55423a', '#705a4e', '#8c7260', '#a88a74']);
  P.fill((x, y) => { const edge = Math.min(x, y, 95 - x, 95 - y); let v = 0.5 + (fbm(x * 0.12, y * 0.12, seed) - 0.5) * 0.5; if (edge < 4) v = edge === 3 ? 0.15 : 0.75 - edge * 0.1; if (h2(x, y, seed + 1) > 0.97) v -= 0.3; return R(v, x, y); });
  return P.done();
}
/** Streets: Worley stones in dark earth. */
export function streetTex(seed: number) {
  const P = new PX(96, 96), R = ramp(['#14121a', '#201d26', '#2e2a34', '#3e3844', '#504852']), cell = 9;
  P.fill((x, y) => {
    const cx = Math.floor(x / cell), cy = Math.floor(y / cell); let d1 = 1e9, d2 = 1e9, id = 0;
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const X = cx + i, Y = cy + j, px = (X + 0.15 + h2(X, Y, seed) * 0.7) * cell, py = (Y + 0.15 + h2(Y, X, seed + 5) * 0.7) * cell, d = Math.hypot(x - px, y - py); if (d < d1) { d2 = d1; d1 = d; id = h2(X, Y, seed + 9); } else if (d < d2) d2 = d; }
    const edge = d2 - d1; let v = 0.45 + id * 0.3 - (d1 / cell) * 0.25 + (fbm(x * 0.3, y * 0.3, seed) - 0.5) * 0.2; if (edge < 1.2) v = 0.06; else if (edge < 2.2) v -= 0.15; return R(v, x, y);
  });
  return P.done();
}
/** Battlement wall: large ashlar blocks, a torch-soot streak now and then. */
export function fortTex(seed: number) {
  const P = new PX(96, 96), R = ramp(['#1c1418', '#2e2226', '#423234', '#584644', '#6e5a54']), course = 16, blk = 32;
  P.fill((x, y) => { const row = Math.floor(y / course), yy = y % course, off = (row % 2) * (blk / 2), xx = (x + off) % blk, id = h2(Math.floor((x + off) / blk), row, seed); let v = 0.5 + id * 0.3 + (fbm(x * 0.15, y * 0.15, seed) - 0.5) * 0.3; if (yy === 0) v = 0.06; else if (yy === 1) v += 0.12; else if (yy === course - 1) v -= 0.15; if (xx === 0 || xx === 1) v = xx === 0 ? 0.08 : v - 0.1; return R(v, x, y); });
  return P.done();
}
export function goldTex(seed: number) { const P = new PX(48, 48), R = ramp(['#4a2c08', '#9a6a18', '#e0b040', '#fff0a0']); P.fill((x, y) => R(0.45 + (fbm(x * 0.2, y * 0.2, seed) - 0.5) * 0.5 + ((x + y) % 6 === 0 ? 0.2 : 0), x, y)); return P.done(); }

/* ------------------------------------------------------------ materials (cached) */
let M: { wallDark: PxMat; wallLit: PxMat; wallLit2: PxMat; wallFire: PxMat; roof: PxMat; street: PxMat; fort: PxMat; gold: PxMat; dome: MeshStandardMaterial } | null = null;
export function setMats() {
  if (M) return M;
  const a = wallTex(1, 1), b = wallTex(5, 1, { cols: ['#2a1c1a', '#432e28', '#5a4036', '#705446', '#866858'] }), c = wallTex(9, 0), d = wallTex(13, 2);
  M = {
    wallLit: pxMat(a.c, { em: a.e, emI: 1.8 }), wallLit2: pxMat(b.c, { em: b.e, emI: 1.6 }), wallDark: pxMat(c.c), wallFire: pxMat(d.c, { em: d.e, emI: 2.6 }),
    roof: pxMat(roofTex(3)), street: pxMat(streetTex(7)), fort: pxMat(fortTex(11)), gold: pxMat(goldTex(2), { rough: 0.5 }),
    dome: new MeshStandardMaterial({ color: '#b08a4a', roughness: 0.55, metalness: 0.3, emissive: new Color('#3a2400'), emissiveIntensity: 0.2 }),
  };
  return M;
}

/* ------------------------------------------------------------ buildings */
export interface BuildingSpec { w: number; d: number; h: number; wall: 'wallLit' | 'wallLit2' | 'wallDark' | 'wallFire'; dome?: boolean; }
/** A building standing on y = 0: walls with world UVs (so windows stay one per floor), a flat roof, optional dome. */
export function building(s: BuildingSpec) {
  const MM = setMats(), g = new Group();
  const walls = new BoxGeometry(s.w, s.h, s.d); walls.translate(0, s.h / 2, 0);
  const body = pxMesh(walls, MM[s.wall]); g.add(body);
  const roof = new BoxGeometry(s.w + 0.3, 0.3, s.d + 0.3); roof.translate(0, s.h + 0.15, 0); g.add(pxMesh(roof, MM.roof));
  if (s.dome) { const r = Math.min(s.w, s.d) * 0.3; const drum = new CylinderGeometry(r * 0.9, r * 0.9, 0.8, 12); drum.translate(0, s.h + 0.7, 0); g.add(pxMesh(drum, MM.fort)); const dome = new Mesh(new SphereGeometry(r, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), MM.dome); dome.position.y = s.h + 1.1; dome.castShadow = true; g.add(dome); const tip = new Mesh(new CylinderGeometry(0.05, 0.12, r * 0.6, 6), MM.gold); tip.position.y = s.h + 1.1 + r + r * 0.3; g.add(tip); }
  return g;
}
/** Instanced boxes of one size class with world UVs computed once for that size. */
export function boxClass(spec: BuildingSpec, count: number) {
  const MM = setMats(); const geo = new BoxGeometry(spec.w, spec.h, spec.d); geo.translate(0, spec.h / 2, 0); worldUV(geo, MM[spec.wall].userData.tile);
  const m = new InstancedMesh(geo, MM[spec.wall], count); m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false;
  const rg = new BoxGeometry(spec.w + 0.3, 0.3, spec.d + 0.3); rg.translate(0, spec.h + 0.15, 0); worldUV(rg, MM.roof.userData.tile);
  const r = new InstancedMesh(rg, MM.roof, count); r.castShadow = false; r.receiveShadow = true; r.frustumCulled = false;
  return { walls: m, roofs: r };
}

/* ------------------------------------------------------------ diyas */
let _diya: { tex: Texture; canvas: HTMLCanvasElement; n: number } | null = null;
/** Clay diya with 3 flame frames: frame 0 unlit bowl, 1..3 lit. 12x14 px each. */
export function diyaAtlas() {
  if (_diya) return _diya;
  const FW = 12, FH = 14, n = 4, P = new PX(FW * n, FH), clay = ramp(['#4a1a12', '#7a2a1c', '#a84a2a', '#d07048'], 0.3), G = ramp(FIRE_RAMP, 0.3);
  for (let f = 0; f < n; f++) {
    const ox = f * FW;
    // bowl: a shallow cup, lip at y=8
    for (let y = 8; y < 13; y++) { const w = y < 10 ? 10 : y < 12 ? 8 : 5; const x0 = Math.round(FW / 2 - w / 2); for (let i = 0; i < w; i++) P.set(ox + x0 + i, y, clay(0.72 - (y - 8) * 0.12 - Math.abs(i - w / 2) / w * 0.3 + (y === 8 ? 0.2 : 0), x0 + i, y)); }
    P.rect(ox + 2, 8, 8, 1, clay(0.95, 0, 0)); P.set(ox + 5, 8, hex('#ffd35a')); P.set(ox + 6, 8, hex('#ffd35a'));
    if (f > 0) { const wob = f === 1 ? 0 : f === 2 ? 1 : -1, hgt = f === 2 ? 6 : 5; for (let y = 0; y < hgt; y++) { const v = 1 - y / hgt; const w = Math.max(1, Math.round((1 - v) * 3.2)); for (let i = -w; i <= w; i++) { const x = ox + 6 + i + (y < 2 ? wob : 0); P.set(x, 8 - hgt + y, G(Math.min(0.99, 0.95 - Math.abs(i) / (w + 1) * 0.5 - v * 0.25), x, y)); } } }
  }
  const canvas = P.done(); const tex = texOf(canvas); tex.repeat.set(1 / n, 1); _diya = { tex, canvas, n }; return _diya;
}
export const DIYA_SIZE = { w: 12 / PPM * 1.3, h: 14 / PPM * 1.3 }; // metres on screen (a touch larger than true scale so they read from the air)

/* ------------------------------------------------------------ smoke / cloud puff texture */
export function puffTex() { const P = new PX(16, 16), R = ramp(['#201a22', '#3a3038', '#56484e', '#6e5e60'], 0.4); P.fill((x, y) => { const dx = (x + 0.5 - 8) / 7, dy = (y + 0.5 - 8) / 7, d = Math.hypot(dx, dy) + (fbm(x * 0.4, y * 0.4, 5) - 0.5) * 0.5; return d < 1 ? R(0.8 - d * 0.6, x, y) : null; }); return texOf(P.done()); }

