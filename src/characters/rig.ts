/**
 * Procedural character rig system.
 *
 * A Rig is a hierarchy of THREE.Group joints. Each frame a character computes a
 * target Pose (joint -> euler rotation, optional position/scale) and calls
 * rig.apply(pose, dt). Joints slerp towards the target so motion is always smooth,
 * even when the driving state jumps (hit reactions, scene changes).
 *
 * Conventions
 *  - 1 unit = 1 metre. Characters face -Z (same direction the camera looks).
 *  - Limbs hang down the joint's local -Y axis. capsule() builds a segment that
 *    starts at the joint origin and extends down -Y, so rotating the joint swings it.
 *  - Rotations are Euler XYZ radians. Positive X tilts the top forward... no:
 *    rotation.x > 0 swings a hanging limb forward (towards -Z); rotation.z > 0 swings it
 *    towards +X (the character's left when facing -Z). Use the helpers below and look at
 *    the result in the showcase (`?showcase=<name>`) rather than reasoning in your head.
 */
import {
  Group, Mesh, Vector3, Quaternion, Euler, MathUtils, CapsuleGeometry, SphereGeometry, CylinderGeometry, ConeGeometry, TorusGeometry, BufferGeometry, BufferAttribute,
  MeshStandardMaterial, MeshPhysicalMaterial, Color, DoubleSide, Material, type ColorRepresentation, LatheGeometry, Vector2, Object3D,
} from 'three';

export type Vec3 = [number, number, number];
export type JointPose = Vec3 | { rot?: Vec3; pos?: Vec3; scale?: number };
export type Pose = Record<string, JointPose>;

const _q = new Quaternion(), _e = new Euler(), _v = new Vector3();

export class Rig {
  root = new Group();
  joints = new Map<string, Group>();
  rest = new Map<string, Vector3>();
  /** Smoothing rate (1/s). Higher snaps faster. */
  rate = 14;
  private tq = new Map<string, Quaternion>();
  private tp = new Map<string, Vector3>();
  private ts = new Map<string, number>();

  joint(name: string, parent: string | null, x = 0, y = 0, z = 0): Group {
    const g = new Group(); g.name = name; g.position.set(x, y, z);
    (parent ? this.get(parent) : this.root).add(g);
    this.joints.set(name, g); this.rest.set(name, new Vector3(x, y, z));
    this.tq.set(name, new Quaternion()); this.tp.set(name, new Vector3(x, y, z)); this.ts.set(name, 1);
    return g;
  }
  get(name: string): Group { const j = this.joints.get(name); if (!j) throw new Error(`Rig: no joint "${name}"`); return j; }
  has(name: string) { return this.joints.has(name); }

  /** Set targets from a pose. Joints not mentioned keep their previous targets. */
  target(pose: Pose) {
    for (const name in pose) {
      const j = this.joints.get(name); if (!j) continue;
      const p = pose[name];
      const rot = Array.isArray(p) ? p : p.rot;
      if (rot) { _e.set(rot[0], rot[1], rot[2], 'XYZ'); this.tq.get(name)!.setFromEuler(_e); }
      if (!Array.isArray(p)) {
        if (p.pos) { const r = this.rest.get(name)!; this.tp.get(name)!.set(r.x + p.pos[0], r.y + p.pos[1], r.z + p.pos[2]); }
        if (p.scale != null) this.ts.set(name, p.scale);
      }
    }
  }
  /** Reset every joint's target to the rest pose. Call before layering poses for a fresh frame. */
  rest_() { for (const [name] of this.joints) { this.tq.get(name)!.identity(); this.tp.get(name)!.copy(this.rest.get(name)!); this.ts.set(name, 1); } }
  /** Ease current joint transforms toward their targets. */
  update(dt: number, rate = this.rate) {
    const k = 1 - Math.exp(-dt * rate);
    for (const [name, j] of this.joints) {
      j.quaternion.slerp(this.tq.get(name)!, k);
      j.position.lerp(this.tp.get(name)!, k);
      const s = MathUtils.lerp(j.scale.x, this.ts.get(name)!, k); j.scale.setScalar(s);
    }
  }
  /** Convenience: target + update in one call. */
  apply(pose: Pose, dt: number, rate = this.rate) { this.target(pose); this.update(dt, rate); }
  /** Snap instantly to the current targets (use on mount). */
  snap() { for (const [name, j] of this.joints) { j.quaternion.copy(this.tq.get(name)!); j.position.copy(this.tp.get(name)!); j.scale.setScalar(this.ts.get(name)!); } }
  /** World position of a joint. */
  worldPos(name: string, out = new Vector3()) { return this.get(name).getWorldPosition(out); }
}

/** Blend two poses: result = a*(1-k) + b*k for joints in either. */
export function blendPose(a: Pose, b: Pose, k: number): Pose {
  const out: Pose = {}; const names = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const n of names) {
    const pa = norm(a[n]), pb = norm(b[n]);
    const rot: Vec3 = [lerp(pa.rot[0], pb.rot[0], k), lerp(pa.rot[1], pb.rot[1], k), lerp(pa.rot[2], pb.rot[2], k)];
    const pos: Vec3 = [lerp(pa.pos[0], pb.pos[0], k), lerp(pa.pos[1], pb.pos[1], k), lerp(pa.pos[2], pb.pos[2], k)];
    out[n] = { rot, pos, scale: lerp(pa.scale, pb.scale, k) };
  }
  return out;
}
/** Add pose b on top of a (rotations add). Useful for layering breathing or hit reactions. */
export function addPose(a: Pose, b: Pose, k = 1): Pose {
  const out: Pose = { ...a }; for (const n in b) { const pa = norm(a[n]), pb = norm(b[n]); out[n] = { rot: [pa.rot[0] + pb.rot[0] * k, pa.rot[1] + pb.rot[1] * k, pa.rot[2] + pb.rot[2] * k], pos: [pa.pos[0] + pb.pos[0] * k, pa.pos[1] + pb.pos[1] * k, pa.pos[2] + pb.pos[2] * k], scale: pa.scale * (1 + (pb.scale - 1) * k) }; }
  return out;
}
function norm(p?: JointPose): { rot: Vec3; pos: Vec3; scale: number } {
  if (!p) return { rot: [0, 0, 0], pos: [0, 0, 0], scale: 1 };
  if (Array.isArray(p)) return { rot: p, pos: [0, 0, 0], scale: 1 };
  return { rot: p.rot || [0, 0, 0], pos: p.pos || [0, 0, 0], scale: p.scale ?? 1 };
}
export const lerp = MathUtils.lerp;
export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const smooth = (x: number) => { const k = clamp01(x); return k * k * (3 - 2 * k); };
export const easeOut = (x: number) => 1 - Math.pow(1 - clamp01(x), 3);
export const easeIn = (x: number) => Math.pow(clamp01(x), 3);
export const easeInOut = (x: number) => { const k = clamp01(x); return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; };
/** Bell curve 0→1→0 over [0,1]. */
export const pulse = (x: number) => Math.sin(Math.PI * clamp01(x));
export const DEG = Math.PI / 180;

/* ---------------------------------------------------------------- materials */
export const mats = {
  skin(color: ColorRepresentation, opts: Partial<MeshPhysicalMaterial> = {}) {
    return new MeshPhysicalMaterial({ color, roughness: 0.55, metalness: 0, sheen: 0.6, sheenColor: new Color(color).offsetHSL(0, 0, 0.12), sheenRoughness: 0.8, clearcoat: 0.08, clearcoatRoughness: 0.6, ...opts });
  },
  gold(opts: Partial<MeshPhysicalMaterial> = {}) {
    return new MeshPhysicalMaterial({ color: '#F2C14E', metalness: 1, roughness: 0.22, emissive: '#3a2400', emissiveIntensity: 0.25, clearcoat: 0.4, ...opts });
  },
  silver(opts: Partial<MeshPhysicalMaterial> = {}) { return new MeshPhysicalMaterial({ color: '#D8DEE6', metalness: 1, roughness: 0.3, ...opts }); },
  silk(color: ColorRepresentation, opts: Partial<MeshPhysicalMaterial> = {}) {
    return new MeshPhysicalMaterial({ color, roughness: 0.6, metalness: 0, sheen: 1, sheenColor: new Color(color).offsetHSL(0, 0.1, 0.25), sheenRoughness: 0.5, side: DoubleSide, ...opts });
  },
  hair(color: ColorRepresentation = '#120d12', opts: Partial<MeshPhysicalMaterial> = {}) { return new MeshPhysicalMaterial({ color, roughness: 0.45, metalness: 0.05, sheen: 0.8, sheenColor: '#4a3a5a', clearcoat: 0.5, clearcoatRoughness: 0.4, ...opts }); },
  ink(opts: Partial<MeshStandardMaterial> = {}) { return new MeshStandardMaterial({ color: '#0b0f17', roughness: 0.75, metalness: 0.1, ...opts }); },
  emissive(color: ColorRepresentation, intensity = 2, opts: Partial<MeshStandardMaterial> = {}) { return new MeshStandardMaterial({ color, emissive: color, emissiveIntensity: intensity, roughness: 0.4, ...opts }); },
  gem(color: ColorRepresentation, opts: Partial<MeshPhysicalMaterial> = {}) { return new MeshPhysicalMaterial({ color, metalness: 0, roughness: 0.05, transmission: 0.3, thickness: 0.2, ior: 2.2, emissive: color, emissiveIntensity: 0.8, ...opts }); },
  stone(color: ColorRepresentation = '#5a4a44', opts: Partial<MeshStandardMaterial> = {}) { return new MeshStandardMaterial({ color, roughness: 0.95, metalness: 0, ...opts }); },
};

/* ------------------------------------------------------------------ meshes */
/** Capsule from the origin down -Y: a limb segment. */
export function capsule(radius: number, length: number, material: Material, radialSegments = 12, capSegments = 6): Mesh {
  const g = new CapsuleGeometry(radius, Math.max(0.001, length - radius * 2), capSegments, radialSegments); g.translate(0, -length / 2, 0);
  const m = new Mesh(g, material); m.castShadow = true; m.receiveShadow = true; return m;
}
/** Tapered limb: a cylinder from radius r1 at the origin to r2 at -length, with a sphere at the origin. */
export function limb(r1: number, r2: number, length: number, material: Material, segments = 12): Group {
  const g = new Group();
  const cyl = new Mesh(new CylinderGeometry(r2, r1, length, segments, 1), material); cyl.position.y = -length / 2; cyl.castShadow = true; cyl.receiveShadow = true; g.add(cyl);
  const s = new Mesh(new SphereGeometry(r1, segments, segments), material); s.castShadow = true; g.add(s);
  const e = new Mesh(new SphereGeometry(r2, segments, segments), material); e.position.y = -length; e.castShadow = true; g.add(e);
  return g;
}
export function sphere(r: number, material: Material, w = 16, h = 12): Mesh { const m = new Mesh(new SphereGeometry(r, w, h), material); m.castShadow = true; m.receiveShadow = true; return m; }
export function cone(r: number, h: number, material: Material, seg = 12): Mesh { const m = new Mesh(new ConeGeometry(r, h, seg), material); m.castShadow = true; return m; }
export function torus(r: number, tube: number, material: Material, seg = 24, tubular = 32): Mesh { const m = new Mesh(new TorusGeometry(r, tube, seg, tubular), material); m.castShadow = true; return m; }
export function cylinder(rt: number, rb: number, h: number, material: Material, seg = 16): Mesh { const m = new Mesh(new CylinderGeometry(rt, rb, h, seg), material); m.castShadow = true; m.receiveShadow = true; return m; }
/** Lathe a profile (array of [radius, y]) around Y. Handy for crowns, pots, lamps, mace heads. */
export function lathe(profile: [number, number][], material: Material, segments = 24): Mesh {
  const pts = profile.map(([r, y]) => new Vector2(r, y)); const m = new Mesh(new LatheGeometry(pts, segments), material); m.castShadow = true; m.receiveShadow = true; return m;
}
export function place<T extends Object3D>(o: T, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, s = 1): T { o.position.set(x, y, z); o.rotation.set(rx, ry, rz); o.scale.setScalar(s); return o; }

/* ------------------------------------------------------------ humanoid rig */
export interface HumanoidOpts {
  height?: number;       // total height in metres
  shoulder?: number;     // half shoulder width
  hip?: number;          // half hip width
  armUpper?: number; armLower?: number; legUpper?: number; legLower?: number;
  torso?: number;        // pelvis -> chest length
  neck?: number;
}
/**
 * Create the standard humanoid joint set on a rig. Joint names:
 * pelvis, spine, chest, neck, head,
 * shoulderL, elbowL, wristL, shoulderR, elbowR, wristR,
 * hipL, kneeL, ankleL, hipR, kneeR, ankleR.
 * "L" is the character's left (+X when facing -Z). Returns the proportions used.
 */
export function humanoid(rig: Rig, o: HumanoidOpts = {}) {
  const h = o.height ?? 1.8, s = h / 1.8;
  const p = { height: h, shoulder: (o.shoulder ?? 0.21) * s, hip: (o.hip ?? 0.1) * s, armUpper: (o.armUpper ?? 0.3) * s, armLower: (o.armLower ?? 0.27) * s, legUpper: (o.legUpper ?? 0.46) * s, legLower: (o.legLower ?? 0.44) * s, torso: (o.torso ?? 0.46) * s, neck: (o.neck ?? 0.1) * s, pelvisY: (0.46 + 0.44 + 0.08) * s };
  rig.joint('pelvis', null, 0, p.pelvisY, 0);
  rig.joint('spine', 'pelvis', 0, p.torso * 0.35, 0);
  rig.joint('chest', 'spine', 0, p.torso * 0.35, 0);
  rig.joint('neck', 'chest', 0, p.torso * 0.3, 0);
  rig.joint('head', 'neck', 0, p.neck, 0);
  for (const side of ['L', 'R'] as const) {
    const sx = side === 'L' ? 1 : -1;
    rig.joint('shoulder' + side, 'chest', sx * p.shoulder, p.torso * 0.26, 0);
    rig.joint('elbow' + side, 'shoulder' + side, 0, -p.armUpper, 0);
    rig.joint('wrist' + side, 'elbow' + side, 0, -p.armLower, 0);
    rig.joint('hip' + side, 'pelvis', sx * p.hip, 0, 0);
    rig.joint('knee' + side, 'hip' + side, 0, -p.legUpper, 0);
    rig.joint('ankle' + side, 'knee' + side, 0, -p.legLower, 0);
  }
  return p;
}

/* --------------------------------------------------------------- eyes */
export interface EyeHandle { group: Group; look(x: number, y: number): void; blink(k: number): void; }
/** A pair of eyes. Call look(dx, dy) with -1..1 and blink(k) with 0 open..1 closed. */
export function eyes(parent: Object3D, opts: { spacing: number; y: number; z: number; radius: number; iris: ColorRepresentation; skin: Material; scleraColor?: ColorRepresentation; lashes?: boolean }): EyeHandle {
  const group = new Group(); parent.add(group); group.position.set(0, opts.y, opts.z);
  const scleraM = new MeshStandardMaterial({ color: opts.scleraColor ?? '#f6f0ea', roughness: 0.25 });
  const irisM = new MeshPhysicalMaterial({ color: opts.iris, roughness: 0.15, clearcoat: 1, emissive: opts.iris, emissiveIntensity: 0.15 });
  const pupilM = new MeshStandardMaterial({ color: '#05060a', roughness: 0.2 });
  const balls: Group[] = [], lids: Mesh[] = [];
  for (const sx of [-1, 1]) {
    const ball = new Group(); ball.position.x = sx * opts.spacing; group.add(ball);
    ball.add(new Mesh(new SphereGeometry(opts.radius, 20, 16), scleraM));
    const iris = new Mesh(new SphereGeometry(opts.radius * 0.55, 20, 16), irisM); iris.position.z = -opts.radius * 0.62; iris.scale.z = 0.5; ball.add(iris);
    const pupil = new Mesh(new SphereGeometry(opts.radius * 0.28, 16, 12), pupilM); pupil.position.z = -opts.radius * 0.86; pupil.scale.z = 0.4; ball.add(pupil);
    const hl = new Mesh(new SphereGeometry(opts.radius * 0.1, 8, 8), new MeshStandardMaterial({ color: '#fff', emissive: '#fff', emissiveIntensity: 2 })); hl.position.set(sx * -opts.radius * 0.2, opts.radius * 0.25, -opts.radius * 0.95); ball.add(hl);
    // eyelid: a slightly larger half sphere, rotates down to close
    const lid = new Mesh(new SphereGeometry(opts.radius * 1.08, 20, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), opts.skin); lid.position.x = sx * opts.spacing; lid.rotation.x = -0.35; group.add(lid); lids.push(lid);
    balls.push(ball);
  }
  return {
    group,
    look(x, y) { for (const b of balls) { b.rotation.y = -x * 0.45; b.rotation.x = y * 0.35; } },
    blink(k) { for (const l of lids) l.rotation.x = -0.35 + k * 1.35; },
  };
}

/* ------------------------------------------------------ verlet chains */
/**
 * A chain of points hanging from an anchor, with distance constraints, gravity,
 * wind and damping. Drive hair, braids, sari pallu, loincloths, tails, feathers.
 */
export class Chain {
  pts: Vector3[] = []; prev: Vector3[] = [];
  seg: number; gravity = new Vector3(0, -9.8, 0); damping = 0.94; wind = new Vector3(); stiffness = 1;
  constructor(public n: number, length: number, anchor: Vector3, public dir = new Vector3(0, -1, 0)) {
    this.seg = length / n;
    for (let i = 0; i <= n; i++) { const p = anchor.clone().addScaledVector(dir, this.seg * i); this.pts.push(p); this.prev.push(p.clone()); }
  }
  step(dt: number, anchor: Vector3, time: number, pin2?: Vector3) {
    dt = Math.min(dt, 1 / 30); const g = this.gravity, d = this.damping;
    this.pts[0].copy(anchor); if (pin2) this.pts[1].copy(pin2);
    for (let i = pin2 ? 2 : 1; i <= this.n; i++) {
      const p = this.pts[i], pr = this.prev[i];
      _v.subVectors(p, pr).multiplyScalar(d); pr.copy(p);
      const gust = 1 + 0.5 * Math.sin(time * 2.3 + i * 0.7) + 0.3 * Math.sin(time * 5.1 + i);
      p.add(_v).addScaledVector(g, dt * dt).addScaledVector(this.wind, dt * dt * gust);
    }
    for (let iter = 0; iter < 3; iter++) for (let i = 1; i <= this.n; i++) {
      const a = this.pts[i - 1], b = this.pts[i]; _v.subVectors(b, a); const len = _v.length() || 1e-6; const diff = (len - this.seg) / len;
      if (i === 1 || (pin2 && i === 2)) b.addScaledVector(_v, -diff); else { a.addScaledVector(_v, diff * 0.5); b.addScaledVector(_v, -diff * 0.5); }
    }
  }
}
/** A ribbon mesh that follows a Chain; width tapers from w0 at the anchor to w1 at the tip. */
export class Ribbon {
  mesh: Mesh; private pos: Float32Array; private side = new Vector3();
  constructor(public chain: Chain, w0: number, w1: number, material: Material, public widthDir = new Vector3(1, 0, 0)) {
    const n = chain.n + 1; const geo = new BufferGeometry(); this.pos = new Float32Array(n * 2 * 3);
    const uv = new Float32Array(n * 2 * 2), idx: number[] = [];
    for (let i = 0; i < n; i++) { uv[(i * 2) * 2] = 0; uv[(i * 2) * 2 + 1] = i / (n - 1); uv[(i * 2 + 1) * 2] = 1; uv[(i * 2 + 1) * 2 + 1] = i / (n - 1); if (i < n - 1) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
    geo.setAttribute('position', new BufferAttribute(this.pos, 3)); geo.setAttribute('uv', new BufferAttribute(uv, 2)); geo.setIndex(idx);
    this.mesh = new Mesh(geo, material); this.mesh.frustumCulled = false; this.mesh.castShadow = true; this.w0 = w0; this.w1 = w1;
  }
  w0: number; w1: number;
  /** Update vertices. Points are in the mesh's local space (use a mesh parented at the world/root). */
  update() {
    const pts = this.chain.pts, n = pts.length; const a = this.pos;
    for (let i = 0; i < n; i++) {
      const p = pts[i]; const next = pts[Math.min(n - 1, i + 1)], prevP = pts[Math.max(0, i - 1)];
      _v.subVectors(next, prevP).normalize(); this.side.crossVectors(_v, this.widthDir).normalize(); if (this.side.lengthSq() < 0.01) this.side.set(1, 0, 0);
      const w = lerp(this.w0, this.w1, i / (n - 1)) * 0.5;
      a[i * 6] = p.x - this.side.x * w; a[i * 6 + 1] = p.y - this.side.y * w; a[i * 6 + 2] = p.z - this.side.z * w;
      a[i * 6 + 3] = p.x + this.side.x * w; a[i * 6 + 4] = p.y + this.side.y * w; a[i * 6 + 5] = p.z + this.side.z * w;
    }
    const attr = this.mesh.geometry.getAttribute('position') as BufferAttribute; attr.needsUpdate = true; this.mesh.geometry.computeVertexNormals();
  }
}
/** A tube of spheres following a Chain (braids, tails, beads). */
export class BeadChain {
  group = new Group(); beads: Mesh[] = [];
  constructor(public chain: Chain, r0: number, r1: number, material: Material) {
    for (let i = 0; i <= chain.n; i++) { const b = sphere(lerp(r0, r1, i / chain.n), material, 10, 8); this.beads.push(b); this.group.add(b); }
  }
  update() { for (let i = 0; i < this.beads.length; i++) this.beads[i].position.copy(this.chain.pts[i]); }
}

/* ------------------------------------------------------- wind cloth */
/**
 * Patch a material so its vertices wave in the wind. Vertices with uv.y near 1 (the top)
 * stay pinned; uv.y near 0 (the hem) swing. Works on any MeshStandard/Physical material.
 * Set material.userData.wind = { amp, freq, time } to drive it (updateWind each frame).
 */
export function windy<T extends Material>(material: T, amp = 0.08, freq = 2.2): T {
  const u = { time: { value: 0 }, amp: { value: amp }, freq: { value: freq } };
  material.userData.wind = u;
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uWTime = u.time; shader.uniforms.uWAmp = u.amp; shader.uniforms.uWFreq = u.freq;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uWTime, uWAmp, uWFreq;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>\n{ float pin = 1.0 - uv.y; float w = pin * pin; transformed.x += sin(uWTime * uWFreq + uv.y * 6.0 + uv.x * 2.0) * uWAmp * w; transformed.z += cos(uWTime * uWFreq * 0.8 + uv.y * 5.0) * uWAmp * 0.7 * w; }`);
  };
  material.customProgramCacheKey = () => 'windy';
  return material;
}
export function updateWind(material: Material, time: number) { const u = material.userData.wind as { time: { value: number } } | undefined; if (u) u.time.value = time; }

/** Simple blink driver: returns 0 open .. 1 closed, blinking every few seconds. */
export function blinkAt(t: number, seed = 0, period = 3.7) { const k = ((t + seed) % period); return k < 0.16 ? pulse(k / 0.16) : 0; }
/** Breathing offset in radians. */
export function breath(t: number, rate = 0.9, amp = 0.03) { return Math.sin(t * rate * Math.PI * 2) * amp; }
export { Group, Vector3, Quaternion, Euler, Color, DoubleSide, MathUtils };
