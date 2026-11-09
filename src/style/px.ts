/**
 * Pixel kit for the HD-2D look (docs/VISUAL-STYLE.md).
 *
 * Low-resolution canvases drawn pixel by pixel, uploaded with NearestFilter, coloured from
 * short ramps through a 4x4 Bayer dither. Sprites are lit Lambert billboards that cast cut-out
 * shadows. Textures keep a constant density of PPM pixels per metre through world-space UVs.
 */
import {
  BufferAttribute, BufferGeometry, CanvasTexture, Color, DoubleSide, LinearFilter, Mesh, MeshBasicMaterial, MeshDepthMaterial, MeshDistanceMaterial,
  MeshLambertMaterial, MeshStandardMaterial, NearestFilter, NearestMipmapLinearFilter, NoColorSpace, PlaneGeometry, RGBADepthPacking, RepeatWrapping,
  SRGBColorSpace, Sprite, SpriteMaterial, AdditiveBlending, type Texture, type ColorRepresentation, BoxGeometry, CylinderGeometry, Group, Vector3,
} from 'three';

export const PPM = 24;          // scene textures: pixels per metre
export const SPX = 1 / 30;      // sprite pixel size in metres (30 px per metre)
export type RGB = [number, number, number];

const B4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
export const bayer = (x: number, y: number) => (B4[(y & 3) * 4 + (x & 3)] + 0.5) / 16;
export function h2(x: number, y: number, s = 0) { let h = (x * 374761393 + y * 668265263 + s * 982451653) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
export function vn2(x: number, y: number, s = 0) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = h2(xi, yi, s), b = h2(xi + 1, yi, s), c = h2(xi, yi + 1, s), d = h2(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
export const fbm = (x: number, y: number, s = 0, o = 4) => { let a = 0, f = 1, w = 0.5, t = 0; for (let i = 0; i < o; i++) { a += vn2(x * f, y * f, s + i * 17) * w; t += w; f *= 2; w *= 0.5; } return a / t; };
export function mulberry(seed: number) { return function () { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export const hex = (c: string): RGB => { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
export const mixc = (a: RGB, b: RGB, t: number): RGB => [Math.round(a[0] + (b[0] - a[0]) * t), Math.round(a[1] + (b[1] - a[1]) * t), Math.round(a[2] + (b[2] - a[2]) * t)];
export const INK = hex('#1a1016');

export type Col = RGB | string;
export type ColFn = (x: number, y: number) => Col | null | undefined;
export type Ramp = (v: number, x: number, y: number) => RGB;

/** Pick from a colour ramp by brightness v (0..1) with a Bayer dither. dz is the dither band width: .22 for sprites, .45 for textures. */
export function ramp(cols: string[], dz = 0.45): Ramp {
  const C = cols.map(hex);
  return (v, x, y) => { v = Math.max(0, Math.min(0.9999, v)) * (C.length - 1); const i = Math.floor(v); let f = v - i; f = dz >= 1 ? f : Math.max(0, Math.min(1, (f - 0.5) / dz + 0.5)); return C[Math.min(C.length - 1, i + (bayer(x, y) < f ? 1 : 0))]; };
}

/** A pixel canvas working directly on ImageData. */
export class PX {
  c: HTMLCanvasElement; g: CanvasRenderingContext2D; d: ImageData;
  constructor(public w: number, public h: number) { this.c = document.createElement('canvas'); this.c.width = w; this.c.height = h; this.g = this.c.getContext('2d', { willReadFrequently: true })!; this.d = this.g.createImageData(w, h); }
  set(x: number, y: number, col: Col, a = 255) { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= this.w || y >= this.h) return; const i = (y * this.w + x) * 4, c = typeof col === 'string' ? hex(col) : col; this.d.data[i] = c[0]; this.d.data[i + 1] = c[1]; this.d.data[i + 2] = c[2]; this.d.data[i + 3] = a; }
  get(x: number, y: number): [number, number, number, number] | null { if (x < 0 || y < 0 || x >= this.w || y >= this.h) return null; const i = (y * this.w + x) * 4, D = this.d.data; return D[i + 3] ? [D[i], D[i + 1], D[i + 2], D[i + 3]] : null; }
  rect(x: number, y: number, w: number, h: number, col: Col | ColFn) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const c = typeof col === 'function' ? col(x + i, y + j) : col; if (c) this.set(x + i, y + j, c); } }
  fill(f: ColFn) { for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) { const c = f(x, y); if (c) this.set(x, y, c); } }
  ellipse(cx: number, cy: number, rx: number, ry: number, col: Col | ((x: number, y: number, dx: number, dy: number) => Col | null | undefined)) { for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) { const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry; if (dx * dx + dy * dy <= 1) { const c = typeof col === 'function' ? col(x, y, dx, dy) : col; if (c) this.set(x, y, c); } } }
  poly(pts: [number, number][], col: Col | ColFn) {
    const ys = pts.map((p) => p[1]), y0 = Math.floor(Math.min(...ys)), y1 = Math.ceil(Math.max(...ys));
    for (let y = y0; y <= y1; y++) {
      const xs: number[] = [], yc = y + 0.5;
      for (let i = 0; i < pts.length; i++) { const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length]; if ((ay <= yc && by > yc) || (by <= yc && ay > yc)) xs.push(ax + ((yc - ay) / (by - ay)) * (bx - ax)); }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.round(xs[k]); x < Math.round(xs[k + 1]); x++) { const c = typeof col === 'function' ? col(x, y) : col; if (c) this.set(x, y, c); }
    }
  }
  line(x0: number, y0: number, x1: number, y1: number, col: Col | ColFn) { x0 |= 0; y0 |= 0; x1 |= 0; y1 |= 0; const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy; for (;;) { const c = typeof col === 'function' ? col(x0, y0) : col; if (c) this.set(x0, y0, c); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } } }
  /** Thick line: a limb. Width w in pixels; col gets (x, y, u along 0..1, s across -1..1). */
  limb(x0: number, y0: number, x1: number, y1: number, w: number, col: (x: number, y: number, u: number, s: number) => Col | null | undefined) {
    const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, hw = w / 2;
    const minX = Math.floor(Math.min(x0, x1) - hw - 1), maxX = Math.ceil(Math.max(x0, x1) + hw + 1), minY = Math.floor(Math.min(y0, y1) - hw - 1), maxY = Math.ceil(Math.max(y0, y1) + hw + 1);
    for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
      const px = x + 0.5 - x0, py = y + 0.5 - y0; let u = (px * dx + py * dy) / (L * L); const s = (px * nx + py * ny) / hw;
      const uc = Math.max(0, Math.min(1, u)); const cx = uc * dx, cy = uc * dy; const d = Math.hypot(px - cx, py - cy);
      if (d <= hw) { u = uc; const c = col(x, y, u, s); if (c) this.set(x, y, c); }
    }
  }
  /** Selout outline: transparent pixels next to opaque ones take the neighbour's colour darkened toward the ink. */
  outline(k = 0.3, tint: RGB = [22, 14, 30]) {
    const src = new Uint8ClampedArray(this.d.data), W = this.w, H = this.h, add: [number, number, RGB][] = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (src[(y * W + x) * 4 + 3]) continue; let n: RGB | null = null;
      for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) { const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= W || Y >= H) continue; const i = (Y * W + X) * 4; if (src[i + 3] > 128) { n = [src[i], src[i + 1], src[i + 2]]; break; } }
      if (n) add.push([x, y, mixc(tint, n, k)]);
    }
    for (const [x, y, c] of add) this.set(x, y, c);
  }
  /** Copy another canvas's pixels in at (ox, oy). */
  blit(src: PX, ox: number, oy: number) { for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) { const c = src.get(x, y); if (c) this.set(ox + x, oy + y, [c[0], c[1], c[2]], c[3]); } }
  done() { this.g.putImageData(this.d, 0, 0); return this.c; }
}

export function texOf(canvas: HTMLCanvasElement, o: { repeat?: [number, number]; mip?: boolean; linear?: boolean } = {}) {
  const t = new CanvasTexture(canvas);
  t.magFilter = NearestFilter; t.minFilter = o.mip ? NearestMipmapLinearFilter : LinearFilter; t.generateMipmaps = !!o.mip;
  t.colorSpace = o.linear ? NoColorSpace : SRGBColorSpace;
  if (o.repeat) { t.wrapS = t.wrapT = RepeatWrapping; t.repeat.set(o.repeat[0], o.repeat[1]); }
  t.anisotropy = 4; return t;
}

/* ------------------------------------------------------------ world UVs and pixel materials */
/** Planar-projected UVs by face normal (metres per tile) so texel density is constant on any geometry. */
export function worldUV(geo: BufferGeometry, tile: number, o: { ou?: number; ov?: number } = {}) {
  geo = geo.index ? geo.toNonIndexed() : geo; geo.computeVertexNormals();
  const p = geo.attributes.position, n = geo.attributes.normal, uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i));
    let u: number, v: number; if (ay >= ax && ay >= az) { u = x; v = z; } else if (ax >= az) { u = z * Math.sign(n.getX(i) || 1); v = y; } else { u = x * Math.sign(n.getZ(i) || 1); v = y; }
    uv[i * 2] = (u + (o.ou ?? 0)) / tile; uv[i * 2 + 1] = (v + (o.ov ?? 0)) / tile;
  }
  geo.setAttribute('uv', new BufferAttribute(uv, 2)); return geo;
}
export interface PxMat extends MeshStandardMaterial { userData: { tile: number } }
/** A pixel-textured standard material. The canvas is PPM px/m, so its tile size in metres is width / PPM. */
export function pxMat(canvas: HTMLCanvasElement, o: { em?: HTMLCanvasElement; emCol?: ColorRepresentation; emI?: number; rough?: number; color?: ColorRepresentation; mip?: boolean } = {}): PxMat {
  const t = texOf(canvas, { repeat: [1, 1], mip: o.mip });
  const m = new MeshStandardMaterial({ map: t, roughness: o.rough ?? 0.92, metalness: 0, color: o.color ?? '#ffffff' }) as PxMat;
  if (o.em) { m.emissiveMap = texOf(o.em, { repeat: [1, 1] }); m.emissive = new Color(o.emCol ?? '#ffffff'); m.emissiveIntensity = o.emI ?? 1; }
  m.userData.tile = canvas.width / PPM; return m;
}
export function pxMesh(geo: BufferGeometry, m: PxMat, o: { cast?: boolean; recv?: boolean; ou?: number; ov?: number } = {}) {
  const g = worldUV(geo, m.userData.tile ?? 4, o); const me = new Mesh(g, m); me.castShadow = o.cast ?? true; me.receiveShadow = o.recv ?? true; return me;
}
/** A box standing on y = 0. */
export const pxBox = (w: number, h: number, d: number, m: PxMat, o?: { cast?: boolean; recv?: boolean }) => { const g = new BoxGeometry(w, h, d); g.translate(0, h / 2, 0); return pxMesh(g, m, o); };
export const pxCyl = (rt: number, rb: number, h: number, m: PxMat, seg = 12, o?: { cast?: boolean; recv?: boolean }) => { const g = new CylinderGeometry(rt, rb, h, seg); g.translate(0, h / 2, 0); return pxMesh(g, m, o); };

/* ------------------------------------------------------------ lit pixel billboards */
export interface SpriteMats { m: MeshLambertMaterial; depth: MeshDepthMaterial; dist: MeshDistanceMaterial; }
/** Lambert sprite material with cut-out shadows. Sprite lighting is capped so a practical can't burn it out (STYLE.md §9). */
export function spriteMats(tex: Texture, em?: Texture | null, o: { emCol?: ColorRepresentation; emI?: number; color?: ColorRepresentation; alphaTest?: number } = {}): SpriteMats {
  const at = o.alphaTest ?? 0.5;
  const m = new MeshLambertMaterial({ map: tex, alphaTest: at, side: DoubleSide, emissiveMap: em || null, emissive: em ? new Color(o.emCol ?? '#ffffff') : new Color(0), emissiveIntensity: o.emI ?? 1 });
  if (o.color) m.color.set(o.color);
  m.onBeforeCompile = (sh) => { sh.fragmentShader = sh.fragmentShader.replace('#include <opaque_fragment>', 'outgoingLight = min(outgoingLight, diffuseColor.rgb * 1.45 + totalEmissiveRadiance);\n#include <opaque_fragment>'); };
  const depth = new MeshDepthMaterial({ depthPacking: RGBADepthPacking, map: tex, alphaTest: at, side: DoubleSide });
  const dist = new MeshDistanceMaterial({ map: tex, alphaTest: at, side: DoubleSide });
  return { m, depth, dist };
}
/** Upright plane, anchored at the midpoint of its bottom edge by default (ax .5, ay 0). */
export function billboard(tex: Texture, wM: number, hM: number, o: { ax?: number; ay?: number; em?: Texture | null; emCol?: ColorRepresentation; emI?: number; shadow?: boolean; receive?: boolean; color?: ColorRepresentation } = {}) {
  const geo = new PlaneGeometry(wM, hM); geo.translate((0.5 - (o.ax ?? 0.5)) * wM, hM / 2 - (o.ay ?? 0) * hM, 0);
  const M = spriteMats(tex, o.em, o);
  const mesh = new Mesh(geo, M.m); mesh.castShadow = o.shadow ?? true; mesh.receiveShadow = o.receive ?? false;
  mesh.customDepthMaterial = M.depth; mesh.customDistanceMaterial = M.dist;
  return mesh;
}

/** A soft radial texture for halos and contact shadows. */
const _radial: Record<string, Texture> = {};
export function radialTex(key = 'soft', stops: [number, string][] = [[0, 'rgba(255,255,255,1)'], [1, 'rgba(255,255,255,0)']]) {
  if (_radial[key]) return _radial[key];
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d')!, g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  for (const [p, col] of stops) g.addColorStop(p, col); x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  const t = new CanvasTexture(c); t.colorSpace = SRGBColorSpace; return (_radial[key] = t);
}
/** Additive halo that always faces the camera: put one on every light source so bloom has something to grab. */
export function glow(col: ColorRepresentation, size: number, i = 1) {
  const s = new Sprite(new SpriteMaterial({ map: radialTex('glow', [[0, 'rgba(255,255,255,1)'], [0.18, 'rgba(255,255,255,.55)'], [0.45, 'rgba(255,255,255,.12)'], [1, 'rgba(255,255,255,0)']]), color: new Color(col).multiplyScalar(i), blending: AdditiveBlending, depthWrite: false, transparent: true, fog: false }));
  s.scale.set(size, size, 1); return s;
}
/** Ground contact shadow. */
export function blob(r: number, a = 0.5, col: ColorRepresentation = '#0a0608') {
  const m = new Mesh(new PlaneGeometry(r * 2, r * 1.2), new MeshBasicMaterial({ map: radialTex('blob', [[0, 'rgba(255,255,255,1)'], [0.5, 'rgba(255,255,255,.5)'], [1, 'rgba(255,255,255,0)']]), color: col, transparent: true, opacity: a, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.renderOrder = 1; (m.material as MeshBasicMaterial).polygonOffset = true; (m.material as MeshBasicMaterial).polygonOffsetFactor = -2; return m;
}

/* ------------------------------------------------------------ pixel flame atlas */
let _fire: { t: Texture; n: number; canvas: HTMLCanvasElement } | null = null;
export const FIRE_RAMP = ['#b3260e', '#f0561a', '#ff9a2a', '#ffd35a', '#fff6c8'];
export function fireAtlas() {
  if (_fire) return _fire;
  const FWp = 16, FHp = 22, n = 6, P = new PX(FWp * n, FHp), G = ramp(FIRE_RAMP, 0.3);
  for (let f = 0; f < n; f++) for (let y = 0; y < FHp; y++) for (let x = 0; x < FWp; x++) {
    const u = (x + 0.5 - FWp / 2) / (FWp / 2), v = 1 - (y + 0.5) / FHp;
    const wob = Math.sin(v * 7 + f * 1.05) * 0.12 * v + (fbm(x * 0.3, y * 0.25 - f * 1.4, 7) - 0.5) * 0.5 * v;
    const wid = Math.pow(1 - v, 0.7) * (1 - v * 0.15), d = Math.abs(u - wob) / Math.max(0.05, wid);
    const heat = 1 - d - v * 0.55 + (fbm(x * 0.5 + f, y * 0.4 - f * 2, 3) - 0.5) * 0.5;
    if (heat > 0.05) P.set(f * FWp + x, y, G(Math.min(0.99, heat * 1.25), x, y));
  }
  const canvas = P.done(); const t = texOf(canvas); t.repeat.set(1 / n, 1); _fire = { t, n, canvas }; return _fire;
}
/** A pixel flame billboard stepping at ~10 fps. Call userData.update(t, camPos, scale). Unlit, so it reads as a light source. */
export function fire(size = 0.8, o: { seed?: number; i?: number } = {}) {
  const A = fireAtlas(), t = A.t.clone(); t.needsUpdate = true; t.repeat.set(1 / A.n, 1);
  const m = new MeshBasicMaterial({ map: t, transparent: true, alphaTest: 0.3, depthWrite: false, color: new Color(1, 1, 1).multiplyScalar(o.i ?? 3), fog: false });
  const geo = new PlaneGeometry(size * 0.73, size); geo.translate(0, size / 2, 0);
  const me = new Mesh(geo, m); me.renderOrder = 3;
  me.userData.update = (tt: number, cam?: { x: number; z: number }, k = 1) => { t.offset.x = (Math.floor(tt * 10 + (o.seed ?? 0)) % A.n) / A.n; if (cam) { const wp = me.getWorldPosition(_wp); me.rotation.y = Math.atan2(cam.x - wp.x, cam.z - wp.z) - (me.parent ? me.parent.rotation.y : 0); } me.scale.setScalar(Math.max(0.001, k)); };
  return me;
}
const _wp = new Vector3();
/** Flame flicker, about ±20 %. */
export const flick = (t: number, s = 0) => 1 + 0.09 * Math.sin(t * 13.1 + s) + 0.06 * Math.sin(t * 23.7 + s * 2.1) + 0.05 * Math.sin(t * 7.3 + s * 3.3);

/** Face a group toward a camera position around Y only. */
export function faceY(obj: Group | Mesh, camX: number, camZ: number) { obj.rotation.y = Math.atan2(camX - obj.position.x, camZ - obj.position.z); }
