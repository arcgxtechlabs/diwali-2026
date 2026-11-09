/**
 * Pixel characters for the HD-2D look: drawn procedurally pixel by pixel from a pose table,
 * packed into an atlas, shown on lit billboards that cast cut-out shadows.
 *
 * A Pose2 is data (angles, flags). The same humanoid drawer draws Krishna, Satyabhama and
 * Narakasura with different costumes; Garuda and the foes have their own drawers. A frame is
 * one entry in a character's pose table; animation is stepping between frames (6–10 fps),
 * while the billboard itself glides with the world.
 *
 * Frame space: pixels, origin at the bottom centre of the frame, y up in metres * 30 (SPX).
 */
import { Group, Mesh, Object3D, Texture, Vector3, MeshLambertMaterial, MeshDepthMaterial, MeshDistanceMaterial } from 'three';
import { PX, ramp, hex, texOf, billboard, blob, INK, mulberry, SPX, type Ramp } from './px';

export type View = 'front' | 'back';
export interface Limb { a: number; b?: number; f?: number }              // angle (0 = hanging down, + toward screen right), bend, foreshortening 0..1
export interface Pose2 {
  view: View;
  bob?: number;                   // whole-figure vertical offset in px
  lean?: number;                  // shoulders x offset in px (torso lean)
  crouch?: number;                // 0..1 lowers the pelvis (knees bent) and shortens the torso
  headX?: number; headY?: number; // head offset in px
  armA: Limb; armB: Limb;         // screen-left arm, screen-right arm
  legA: Limb; legB: Limb;         // screen-left leg, screen-right leg
  sit?: boolean;                  // seated: thighs come toward the viewer (foreshortened)
  kneel?: 'A' | 'B';              // that leg folded on the ground
  bow?: { hand: 'A' | 'B'; draw: number; glow?: boolean };   // bow held in that hand, string pulled by the other
  mace?: 'A' | 'B';               // mace in that hand (Narakasura)
  eyes?: 'open' | 'closed' | 'blink' | 'angry' | 'glow';
  mouth?: 'calm' | 'open' | 'roar';
  wings?: number;                 // asura wings: angle 0..1 (down..up)
  limp?: boolean;                 // hair and cloth hang straight (fallen)
}
export interface Costume {
  kind: 'krishna' | 'satyabhama' | 'narakasura' | 'asura';
  height: number;                 // metres
  skin: Ramp; cloth: Ramp; cloth2?: Ramp; hair: Ramp; gold: Ramp;
  bulk: number;                   // limb thickness multiplier
  shoulder: number;               // half shoulder width in metres (at height 1.8)
}
const R = (cols: string[]) => ramp(cols, 0.22);
export const COSTUMES: Record<Costume['kind'], Costume> = {
  krishna: { kind: 'krishna', height: 1.8, skin: R(['#1f3f8a', '#2f5cb8', '#4a7bd8', '#7aa4ee', '#b4d0ff']), cloth: R(['#8a5a10', '#c48a1c', '#f2b33d', '#ffd978', '#fff0b8']), hair: R(['#0b0a14', '#191628', '#2a2642']), gold: R(['#6a4410', '#b88a2a', '#f6d060', '#fff5c0']), bulk: 1, shoulder: 0.2 },
  satyabhama: { kind: 'satyabhama', height: 1.7, skin: R(['#6a3a22', '#95593a', '#b9774f', '#dba074', '#f4c9a0']), cloth: R(['#5a1612', '#8f2a24', '#c2423a', '#e06a52', '#f6a088']), cloth2: R(['#7a4a10', '#c89a2c', '#f2c45a', '#ffe9a8']), hair: R(['#0b0810', '#1a1220', '#2c2034']), gold: R(['#6a4410', '#b88a2a', '#f6d060', '#fff5c0']), bulk: 0.9, shoulder: 0.18 },
  narakasura: { kind: 'narakasura', height: 9.5, skin: R(['#1c1018', '#33202c', '#4e3444', '#6c4c5e', '#8a6678']), cloth: R(['#2a0a10', '#4a1018', '#6a1a22', '#8a2a2a']), hair: R(['#050307', '#120c12', '#1e161e']), gold: R(['#4a2c08', '#9a6a18', '#e0b040', '#fff0a0']), bulk: 1.45, shoulder: 0.27 },
  asura: { kind: 'asura', height: 1.6, skin: R(['#1a1420', '#2e2638', '#463c54', '#60546e']), cloth: R(['#3a0c10', '#6a1a1a', '#9a2a1a']), hair: R(['#050307', '#120c12']), gold: R(['#4a2c08', '#9a6a18', '#e0b040']), bulk: 1, shoulder: 0.2 },
};
export const EMBER = ramp(['#8a1a08', '#e0421a', '#ff8c2a', '#ffd35a', '#fff6c8'], 0.22);
const PEACOCK = ramp(['#0a4a4a', '#0e8a7a', '#1ec8a8', '#7ff0d8'], 0.22);
const WHITE = hex('#f6f0e2');

/** Frame canvas size in px for a costume (room for raised arms, a bow above the head and a mace). */
export function frameSize(c: Costume) { const h = c.height / SPX; return { w: Math.ceil(h * 0.9 / 2) * 2, h: Math.ceil(h * 1.32) }; }

interface Ctx { P: PX; E: PX; W: number; H: number; S: number; c: Costume; pose: Pose2; light: number }
const pt = (k: Ctx, xM: number, yM: number): [number, number] => [k.W / 2 + xM * k.S, k.H - 1 - yM * k.S - (k.pose.bob ?? 0)];

/** Thick limb with cylindrical shading from a light at the upper left. */
function limb(k: Ctx, x0: number, y0: number, x1: number, y1: number, w: number, ramp: Ramp, base = 0.6) {
  k.P.limb(x0, y0, x1, y1, w, (x, y, u, s) => ramp(base - s * 0.22 * k.light - u * 0.08 + (s < -0.55 ? 0.08 : 0), x, y));
}
function armChain(k: Ctx, sx: number, sy: number, L: Limb, upper: number, lower: number): [number, number, number, number, number, number] {
  const f = L.f ?? 1, a = L.a, b = a + (L.b ?? 0);
  const ex = sx + Math.sin(a) * upper * f, ey = sy + Math.cos(a) * upper * f;
  const hx = ex + Math.sin(b) * lower * f, hy = ey + Math.cos(b) * lower * f;
  return [sx, sy, ex, ey, hx, hy];
}

/** Draws a humanoid with its costume into k.P (colour) and k.E (emissive). Returns hand positions for props. */
export function drawHumanoid(k: Ctx) {
  const { P, E, S, c, pose } = k; const view = pose.view, s = c.height / 1.8, bulk = c.bulk * s;
  const crouch = pose.crouch ?? 0, pelvisY = (0.98 - crouch * 0.32) * s, chestY = (1.42 - crouch * 0.12) * s, neckY = (1.52 - crouch * 0.12) * s, headY = (1.66 - crouch * 0.12) * s, headR = (c.kind === 'narakasura' ? 0.125 : 0.115) * s;
  const shW = c.shoulder * s, hipW = 0.1 * s, lean = pose.lean ?? 0;
  const [, pelvisPy] = pt(k, 0, pelvisY), [, chestPy] = pt(k, 0, chestY);
  const upperArm = 0.3 * s * S, lowerArm = 0.27 * s * S, thigh = 0.46 * s * S, shin = 0.44 * s * S;
  const armW = 4 * bulk, forearmW = 3.4 * bulk, thighW = 6 * bulk, shinW = 4.6 * bulk;
  const skinL = c.kind === 'narakasura' ? c.skin : c.skin;

  // ---- legs
  const hips: [number, number][] = [[-hipW, pelvisY], [hipW, pelvisY]];
  const legs = [pose.legA, pose.legB];
  const feet: [number, number][] = [];
  for (let i = 0; i < 2; i++) {
    const [hx0, hy0] = pt(k, hips[i][0], pelvisY - 0.02 * s); const L = legs[i];
    if (pose.kneel === (i === 0 ? 'A' : 'B')) { // folded: thigh down-forward, shin flat on the ground behind
      const [, kx, ky] = [0, hx0 + (i === 0 ? -1 : 1) * thigh * 0.25, hy0 + thigh * 0.95] as const;
      limb(k, hx0, hy0, kx, ky, thighW, i === 0 || c.kind === 'krishna' ? c.cloth : skinL, 0.55);
      limb(k, kx, ky, kx + (i === 0 ? -1 : 1) * shin * 0.8, ky + 1, shinW, skinL, 0.5); feet.push([kx, ky]); continue;
    }
    if (pose.sit) { // seated: thigh toward the viewer (short), shin hanging
      const f = 0.32, [sx, sy, ex, ey, fx, fy] = armChain(k, hx0, hy0, { a: L.a, b: L.b ?? 0, f: 1 }, thigh * f, shin * 0.85);
      limb(k, sx, sy, ex, ey, thighW * 1.15, c.kind === 'satyabhama' ? c.cloth : c.kind === 'krishna' ? c.cloth : skinL, 0.6);
      limb(k, ex, ey, fx, fy, shinW, c.kind === 'satyabhama' ? c.cloth : skinL, 0.5); feet.push([fx, fy]); continue;
    }
    const [sx, sy, ex, ey, fx, fy] = armChain(k, hx0, hy0, L, thigh, shin);
    const upperCloth = c.kind === 'satyabhama' || c.kind === 'krishna' || c.kind === 'narakasura';
    limb(k, sx, sy, ex, ey, thighW, upperCloth ? c.cloth : skinL, 0.6);
    limb(k, ex, ey, fx, fy, shinW, c.kind === 'satyabhama' ? c.cloth : skinL, 0.52);
    // feet / anklets
    P.rect(Math.round(fx - shinW * 0.6), Math.round(fy - 1), Math.round(shinW * 1.2), 2, c.kind === 'narakasura' ? c.gold(0.6, 0, 0) : c.skin(0.35, 0, 0));
    if (c.kind !== 'asura') P.rect(Math.round(fx - shinW * 0.55), Math.round(fy - 3), Math.round(shinW * 1.1), 1, c.gold(0.8, 0, 0));
    feet.push([fx, fy]);
  }
  // ---- torso: a trapezoid from the shoulders to the hips, clothed by costume
  const [slx, sly] = pt(k, -shW + lean / S, chestY + 0.05 * s), [srx] = pt(k, shW + lean / S, chestY + 0.05 * s), [hlx, hly] = pt(k, -hipW * 1.3, pelvisY - 0.06 * s), [hrx] = pt(k, hipW * 1.3, pelvisY - 0.06 * s);
  const torsoRamp = c.kind === 'satyabhama' ? c.cloth : skinL;
  P.poly([[slx, sly], [srx, sly], [hrx, hly], [hlx, hly]], (x, y) => { const u = (y - sly) / (hly - sly), l = slx + (hlx - slx) * u, r = srx + (hrx - srx) * u, sx = ((x - l) / Math.max(1, r - l)) * 2 - 1; let v = 0.62 - sx * 0.2 * k.light - u * 0.1; if (view === 'back') v -= 0.06; if (c.kind === 'narakasura' && Math.abs(sx) < 0.08) v -= 0.15; return torsoRamp(v, x, y); });
  // skirt / dhoti / kilt: from the hips down, over the thighs
  const skirtBottom = c.kind === 'satyabhama' ? 0.08 * s : c.kind === 'narakasura' ? 0.45 * s : 0.5 * s;
  if (!pose.sit || c.kind === 'satyabhama') {
    const [, sbY] = pt(k, 0, skirtBottom); const flare = c.kind === 'satyabhama' ? 0.2 * s : 0.14 * s;
    const [fl] = pt(k, -flare, 0), [fr] = pt(k, flare, 0); const topY = pt(k, 0, pelvisY + 0.02 * s)[1];
    const yEnd = pose.sit ? pt(k, 0, pelvisY - 0.25 * s)[1] : sbY;
    P.poly([[hlx - 1, topY], [hrx + 1, topY], [fr, yEnd], [fl, yEnd]], (x, y) => {
      const u = (y - topY) / Math.max(1, yEnd - topY), l = hlx - 1 + (fl - hlx + 1) * u, r = hrx + 1 + (fr - hrx - 1) * u, sx = ((x - l) / Math.max(1, r - l)) * 2 - 1;
      let v = 0.6 - sx * 0.22 * k.light - u * 0.08; const pleat = Math.floor((sx + 1) * (c.kind === 'narakasura' ? 3 : 4.5)); if (pleat % 2 === 0) v -= 0.14;
      if (c.kind === 'satyabhama' && (yEnd - y < 3 || (yEnd - y < 7 && yEnd - y > 4))) return c.cloth2!(0.8 - (yEnd - y) * 0.05, x, y);
      if (c.kind === 'narakasura' && yEnd - y < 3) return c.gold(0.5, x, y);
      return c.cloth(v, x, y);
    });
  }
  // belt / waistband
  P.rect(hlx - 1, Math.round(pelvisPy), hrx - hlx + 2, Math.max(1, Math.round(S * 0.035 * s)), (x, y) => c.gold(0.55 + ((x + y) % 3 === 0 ? 0.3 : 0), x, y));
  if (c.kind === 'satyabhama') { // blouse + sari border across the torso, pallu over the screen-left shoulder
    const by = Math.round(chestPy + S * 0.14 * s); P.rect(hlx, by, hrx - hlx + 1, 2, (x, y) => c.cloth2!(0.7 + ((x + y) % 2) * 0.2, x, y));
    for (let y = sly - 2; y < hly; y++) { const w = 3 + Math.floor((y - sly) / 7); const x0 = slx + 1 + Math.floor((y - sly) * 0.35); P.rect(x0, y, w, 1, (xx, yy) => (((xx + yy) % 5) === 0 ? c.cloth2!(0.8, xx, yy) : c.cloth(0.45 - ((yy - sly) / (hly - sly)) * 0.1, xx, yy))); }
  }
  if (c.kind === 'krishna') { // necklace and sash
    P.rect(slx + 2, sly + 2, srx - slx - 4, 1, (x, y) => c.gold(0.6 + ((x % 2) * 0.3), x, y)); P.set(Math.round((slx + srx) / 2), sly + 4, c.gold(0.95, 0, 0)); P.set(Math.round((slx + srx) / 2), sly + 5, hex('#ff8071'));
  }
  if (c.kind === 'narakasura') { // armour plate, shoulder guards, chest scar glow
    const cx = Math.round((slx + srx) / 2); for (let y = sly + 3; y < chestPy + S * 0.35 * s; y++) { const w = Math.round((srx - slx) * 0.36 * (1 - (y - sly) / (chestPy + S * 0.35 * s - sly) * 0.4)); P.rect(cx - w, y, w * 2, 1, (x, yy) => c.gold(0.45 + Math.abs(x - cx) / w * 0.3 + ((x + yy) % 4 === 0 ? 0.15 : 0), x, yy)); }
    for (const sx of [slx, srx]) P.ellipse(sx, sly + 1, S * 0.14 * s, S * 0.08 * s, (x, y, dx, dy) => c.gold(0.5 - dy * 0.3 - dx * 0.1, x, y));
  }
  if (c.kind === 'asura') { P.rect(slx + 1, sly + 1, srx - slx - 2, 2, (x, y) => c.cloth(0.5 + ((x + y) % 2) * 0.3, x, y)); }
  // ---- arms (over the torso)
  const hands: [number, number][] = [];
  const shoulders: [number, number][] = [pt(k, -shW * 0.95 + lean / S, chestY + 0.03 * s), pt(k, shW * 0.95 + lean / S, chestY + 0.03 * s)];
  const armsL = [pose.armA, pose.armB];
  for (let i = 0; i < 2; i++) {
    const [sx, sy, ex, ey, hx, hy] = armChain(k, shoulders[i][0], shoulders[i][1], armsL[i], upperArm, lowerArm);
    const sleeve = c.kind === 'satyabhama' ? c.cloth : skinL;
    limb(k, sx, sy, ex, ey, armW, sleeve, 0.6); limb(k, ex, ey, hx, hy, forearmW, skinL, 0.58);
    // armlet and bangle
    if (c.kind !== 'asura') { const mx = (sx + ex) / 2, my = (sy + ey) / 2; P.rect(Math.round(mx - armW / 2), Math.round(my), Math.round(armW), 1, c.gold(0.85, 0, 0)); P.rect(Math.round(hx - forearmW / 2 - (hx - ex) * 0.1), Math.round(hy - (hy - ey) * 0.15), Math.round(forearmW), 1, c.gold(0.8, 0, 0)); }
    P.ellipse(hx, hy, forearmW * 0.55, forearmW * 0.55, (x, y, dx, dy) => skinL(0.6 - dy * 0.2, x, y));
    hands.push([hx, hy]);
  }
  // ---- asura ember wings
  if (c.kind === 'asura' && pose.wings != null) {
    const [cx, cy] = pt(k, 0, chestY); const up = pose.wings; const span = S * 0.9 * s, lift = S * (0.1 + up * 0.7) * s;
    for (const sgn of [-1, 1]) {
      const tip: [number, number] = [cx + sgn * span, cy - lift], mid: [number, number] = [cx + sgn * span * 0.55, cy - lift * 0.55 - S * 0.12 * s], root: [number, number] = [cx + sgn * S * 0.1 * s, cy + 2];
      P.poly([root, mid, tip, [cx + sgn * span * 0.75, cy + S * 0.15 * s - lift * 0.2], [cx + sgn * span * 0.35, cy + S * 0.22 * s]], (x, y) => { const d = Math.hypot(x - cx, y - cy) / span; const v = 0.95 - d * 0.9 + ((x * 3 + y) % 7 === 0 ? 0.2 : 0); const col = EMBER(Math.max(0.05, v), x, y); if (v > 0.45) E.set(x, y, col); return col; });
      P.line(root[0], root[1], tip[0], tip[1], INK);
    }
  }
  // ---- head
  const [hcx, hcy] = pt(k, (pose.headX ?? 0) / S + lean / S, headY); const hr = headR * S;
  // hair behind the head (and down the back for long hair)
  if (c.kind !== 'asura') {
    const long = c.kind === 'satyabhama' ? 0.9 : c.kind === 'krishna' ? 0.35 : 0.6;
    if (view === 'back' || c.kind === 'narakasura') { const len = long * S * s * (pose.limp ? 1.2 : 1); P.poly([[hcx - hr * 0.9, hcy], [hcx + hr * 0.9, hcy], [hcx + hr * (c.kind === 'satyabhama' ? 0.35 : 0.7), hcy + hr + len], [hcx - hr * (c.kind === 'satyabhama' ? 0.35 : 0.7), hcy + hr + len]], (x, y) => c.hair(0.5 - (y - hcy) / (hr + len) * 0.3 + ((x + y) % 4 === 0 ? 0.25 : 0), x, y)); if (c.kind === 'satyabhama') for (let y = Math.round(hcy + hr); y < hcy + hr + len; y += 4) P.set(hcx, y, c.gold(0.9, 0, 0)); }
    else P.ellipse(hcx, hcy - hr * 0.15, hr * 1.12, hr * 1.1, (x, y, dx, dy) => c.hair(0.5 - dy * 0.3, x, y));
  }
  // face / back of head
  P.ellipse(hcx, hcy, hr, hr * 1.05, (x, y, dx, dy) => {
    if (view === 'back' && c.kind !== 'narakasura') return c.hair(0.55 - dx * 0.2 - dy * 0.25, x, y);
    return skinL(0.66 - dx * 0.16 * k.light - dy * 0.22 + (dy > 0.6 ? -0.15 : 0), x, y);
  });
  if (view === 'front' || c.kind === 'narakasura') {
    const ey = Math.round(hcy - hr * 0.08), ex = Math.round(hr * 0.42);
    const eyes = pose.eyes ?? 'open';
    for (const sgn of [-1, 1]) {
      const x = Math.round(hcx + sgn * ex);
      if (eyes === 'glow') { const g = EMBER(0.95, 0, 0); for (let i = -1; i <= 1; i++) { P.set(x + i, ey, g); E.set(x + i, ey, g); } P.set(x, ey - 1, EMBER(0.7, 0, 0)); E.set(x, ey - 1, EMBER(0.7, 0, 0)); }
      else if (eyes === 'closed' || eyes === 'blink') P.rect(x - 1, ey, 3, 1, skinL(0.25, 0, 0));
      else { P.rect(x - 1, ey, 3, 1, WHITE); P.set(x + (sgn > 0 ? 0 : 0), ey, INK); P.set(x, ey - 1, eyes === 'angry' ? INK : skinL(0.3, 0, 0)); if (eyes === 'angry') P.set(x - sgn, ey - 1, INK); }
    }
    // brow line, nose, mouth
    P.set(hcx, ey + 1, skinL(0.38, 0, 0));
    const my = Math.round(hcy + hr * 0.45); const mouth = pose.mouth ?? 'calm';
    if (mouth === 'roar') { P.rect(hcx - Math.round(hr * 0.45), my - 1, Math.round(hr * 0.9), 3, INK); P.rect(hcx - Math.round(hr * 0.35), my + 1, Math.round(hr * 0.7), 1, hex('#8a1a1a')); if (c.kind === 'narakasura') { P.set(hcx - Math.round(hr * 0.3), my - 2, WHITE); P.set(hcx + Math.round(hr * 0.3), my - 2, WHITE); } }
    else if (mouth === 'open') P.rect(hcx - 1, my, 3, 2, INK);
    else P.rect(hcx - 1, my, 3, 1, skinL(0.3, 0, 0));
    if (c.kind === 'satyabhama') P.set(hcx, Math.round(hcy - hr * 0.4), hex('#e0362a'));            // bindi
    if (c.kind === 'narakasura') { P.set(hcx - Math.round(hr * 0.33), my + 1, WHITE); P.set(hcx + Math.round(hr * 0.33), my + 1, WHITE); P.set(hcx - Math.round(hr * 0.33), my + 2, WHITE); P.set(hcx + Math.round(hr * 0.33), my + 2, WHITE); } // tusks
  }
  // earrings
  if (c.kind === 'satyabhama' || c.kind === 'krishna') for (const sgn of [-1, 1]) { P.set(Math.round(hcx + sgn * hr), Math.round(hcy + hr * 0.3), c.gold(0.9, 0, 0)); P.set(Math.round(hcx + sgn * hr), Math.round(hcy + hr * 0.3) + 1, c.gold(0.7, 0, 0)); }
  // crowns and horns
  if (c.kind === 'krishna') { // golden mukut with a peacock feather
    const top = Math.round(hcy - hr * 1.05); P.poly([[hcx - hr * 0.9, top + 2], [hcx + hr * 0.9, top + 2], [hcx + hr * 0.55, top - hr * 0.55], [hcx, top - hr * 0.85], [hcx - hr * 0.55, top - hr * 0.55]], (x, y) => c.gold(0.55 + (top + 2 - y) / hr * 0.3 + ((x + y) % 3 === 0 ? 0.2 : 0), x, y));
    P.set(hcx, top - 1, hex('#ff8071')); P.set(hcx - 2, top, hex('#0cc1e0')); P.set(hcx + 2, top, hex('#0cc1e0'));
    const fx = hcx + hr * 0.4, fy0 = top - hr * 0.6; for (let i = 0; i < Math.round(hr * 1.1); i++) { const x = Math.round(fx + i * 0.45), y = Math.round(fy0 - i); P.set(x, y, i < hr * 0.9 ? PEACOCK(0.5 + i / hr * 0.3, x, y) : PEACOCK(0.9, x, y)); if (i > hr * 0.3 && i < hr * 0.9) { P.set(x - 1, y, PEACOCK(0.35, x, y)); P.set(x + 1, y, PEACOCK(0.6, x, y)); } }
    const ex2 = Math.round(fx + hr * 1.1 * 0.45), ey2 = Math.round(fy0 - hr * 1.1); P.set(ex2, ey2, hex('#0cc1e0')); P.set(ex2, ey2 + 1, c.gold(0.9, 0, 0)); P.set(ex2 - 1, ey2 + 1, hex('#1f3f8a')); P.set(ex2 + 1, ey2 + 1, hex('#1f3f8a'));
  }
  if (c.kind === 'satyabhama') { const top = Math.round(hcy - hr * 0.95); P.rect(hcx - Math.round(hr * 0.6), top, Math.round(hr * 1.2), 2, (x, y) => c.gold(0.6 + ((x + y) % 2) * 0.3, x, y)); P.set(hcx, top - 1, hex('#e0362a')); }
  if (c.kind === 'narakasura' || c.kind === 'asura') { // horns
    for (const sgn of [-1, 1]) { const n = Math.round(hr * (c.kind === 'narakasura' ? 2.0 : 0.9)); for (let i = 0; i < n; i++) { const x = Math.round(hcx + sgn * (hr * 0.6 + i * 0.55)), y = Math.round(hcy - hr * 0.6 - i * 0.95 + (i * i) / n * 0.5); const w = Math.max(1, Math.round((1 - i / n) * hr * 0.3)); P.rect(x - w, y, w * 2 + 1, 1, (xx, yy) => c.gold(0.35 + i / n * 0.5 - Math.abs(xx - x) / (w + 1) * 0.2, xx, yy)); } }
    if (c.kind === 'narakasura') { const top = Math.round(hcy - hr * 0.9); P.rect(hcx - Math.round(hr * 0.7), top, Math.round(hr * 1.4), 3, (x, y) => c.gold(0.5 + ((x + y) % 3 === 0 ? 0.35 : 0), x, y)); P.set(hcx, top + 1, EMBER(0.9, 0, 0)); E.set(hcx, top + 1, EMBER(0.9, 0, 0)); }
  }
  // ---- props
  if (pose.bow) {
    const hi = pose.bow.hand === 'A' ? 0 : 1, [bx, by] = hands[hi], [dx, dy] = hands[1 - hi]; const half = S * 0.62 * s;
    const col = (x: number, y: number) => c.gold(0.55 + ((y % 4) === 0 ? 0.3 : 0), x, y);
    // a recurve bow: two arcs meeting at the grip
    for (let i = -half; i <= half; i++) { const u = i / half; const curve = Math.sign(u) * 0 + (1 - Math.abs(u)) * 0; const x = Math.round(bx + Math.sin(u * 0.9) * S * 0.06 * s + curve), y = Math.round(by + i); P.set(x, y, col(x, y)); if (Math.abs(u) < 0.12) P.set(x + 1, y, c.gold(0.3, 0, 0)); }
    // string: from the tips to the drawing hand
    const d = pose.bow.draw; const tx = Math.round(bx + Math.sin(0.9) * S * 0.06 * s);
    const sxp = d > 0.02 ? dx : tx, syp = d > 0.02 ? dy : by;
    P.line(tx, Math.round(by - half), sxp, Math.round(syp), (x, y) => (pose.bow!.glow ? (E.set(x, y, WHITE), WHITE) : hex('#d8d2c0')));
    P.line(tx, Math.round(by + half), sxp, Math.round(syp), (x, y) => (pose.bow!.glow ? (E.set(x, y, WHITE), WHITE) : hex('#d8d2c0')));
    if (d > 0.02) { // arrow from the hand to past the bow: foreshortened toward the target, so a short bright shaft
      const ax = Math.round(bx), ay = Math.round(by); P.line(sxp, syp, ax, ay, (x, y) => { const g = pose.bow!.glow ? EMBER(0.95, x, y) : hex('#ffd35a'); if (pose.bow!.glow) E.set(x, y, g); return g; }); P.set(ax, ay, WHITE); E.set(ax, ay, WHITE);
    }
  }
  if (pose.mace) {
    const [mx, my] = hands[pose.mace === 'A' ? 0 : 1]; const L = pose.mace === 'A' ? pose.armA : pose.armB; const dir = L.a + (L.b ?? 0) + 0.45 * (pose.mace === 'A' ? -1 : 1);   // the mace continues the forearm, slightly outward
    const len = S * 1.9 * s * 0.3, ex = mx + Math.sin(dir) * len, ey = my + Math.cos(dir) * len;
    k.P.limb(mx, my, ex, ey, 5 * s * 0.3, (x, y, u, sx) => c.hair(0.5 - sx * 0.3, x, y));
    const hr2 = S * 0.42 * s * 0.3; P.ellipse(ex, ey, hr2, hr2, (x, y, dx, dy) => { const d = Math.hypot(dx, dy); const col = d > 0.78 ? c.gold(0.35 + ((x + y) % 3 === 0 ? 0.4 : 0), x, y) : EMBER(0.9 - d * 0.5, x, y); if (d <= 0.78) E.set(x, y, col); return col; });
    for (let a = 0; a < 8; a++) { const sx = Math.round(ex + Math.cos(a * 0.785) * hr2 * 1.25), sy = Math.round(ey + Math.sin(a * 0.785) * hr2 * 1.25); P.set(sx, sy, c.gold(0.9, 0, 0)); P.set(sx, sy - 1, EMBER(0.8, 0, 0)); E.set(sx, sy - 1, EMBER(0.8, 0, 0)); }
  }
  return { hands, feet, head: [hcx, hcy] as [number, number] };
}

/* ------------------------------------------------------------ Garuda */
export const GARUDA = { w: 9.2, h: 4.6 }; // metres: wingspan, frame height
const G_FEATHER = ramp(['#3a1208', '#6a2414', '#9a3a1a', '#c8622a', '#e89a48'], 0.22), G_GOLD = ramp(['#6a4410', '#b88a2a', '#f6d060', '#fff5c0'], 0.22), G_WHITE = ramp(['#8a7a6a', '#c8b8a0', '#f0e6d2', '#fff8ea'], 0.22);
/** Garuda from behind (riders sit on his back), wings at `flap` (-1 down .. 1 up). view 'front' flips the head/eyes. */
export function drawGaruda(P: PX, E: PX, W: number, H: number, flap: number, view: View, light = 1) {
  const S = 1 / SPX, cx = W / 2, baseY = H - 1 - 1.2 * S; // body centre line at 1.2 m above the frame bottom
  const bodyW = 0.5 * S, bodyH = 1.5 * S;
  // tail feathers (fan, behind the body)
  for (let i = -3; i <= 3; i++) { const a = i * 0.16, len = 1.6 * S * (1 - Math.abs(i) * 0.08); const x1 = cx + Math.sin(a) * len * 0.6, y1 = baseY + bodyH * 0.55 + Math.cos(a) * len; P.limb(cx + i * 2, baseY + bodyH * 0.45, x1, y1, 5, (x, y, u, s) => (u > 0.82 ? G_GOLD(0.7 - Math.abs(s) * 0.3, x, y) : G_FEATHER(0.55 - Math.abs(s) * 0.25 - u * 0.15 + (i % 2 === 0 ? 0.1 : 0), x, y))); }
  // wings: three feather rows from the shoulder, angle by flap
  const shoulderY = baseY - bodyH * 0.25; const up = flap * 0.75;
  for (const sgn of [-1, 1]) {
    const span = GARUDA.w / 2 * S * 0.96;
    const tipX = cx + sgn * span, tipY = shoulderY - Math.sin(up) * span * 0.9 - 0.15 * S;
    const elbowX = cx + sgn * span * 0.42, elbowY = shoulderY - Math.sin(up) * span * 0.38 - 0.25 * S * (1 - Math.abs(flap));
    // arm bone and leading edge
    const pts: [number, number][] = [[cx + sgn * bodyW * 0.6, shoulderY], [elbowX, elbowY], [tipX, tipY]];
    // secondary feathers hang from the arm toward the tail
    const drop = (0.9 - Math.max(0, flap) * 0.25) * S;
    const poly: [number, number][] = [pts[0], pts[1], pts[2], [tipX - sgn * span * 0.06, tipY + drop * 0.9], [elbowX + sgn * span * 0.05, elbowY + drop * 1.15], [cx + sgn * bodyW * 0.5, shoulderY + drop * 1.05]];
    P.poly(poly, (x, y) => {
      const u = Math.abs(x - cx) / span; const row = Math.floor(((y - (shoulderY - Math.sin(up) * Math.abs(x - cx) * 0.9)) / drop) * 3.2);
      const feather = Math.floor(u * 22 + row * 0.5) % 2 === 0 ? 0.08 : -0.06;
      if (u > 0.55 && row >= 2) return G_GOLD(0.6 - u * 0.3 + feather, x, y);
      return G_FEATHER(0.68 - u * 0.25 - row * 0.1 + feather - (sgn * light > 0 ? 0.08 : 0), x, y);
    });
    // primary feather tips split
    for (let i = 0; i < 5; i++) { const u = 0.72 + i * 0.07; const x = cx + sgn * span * u, y = shoulderY - Math.sin(up) * span * u * 0.9 - 0.15 * S + drop * (0.9 - i * 0.1); P.limb(x, y - 3, x - sgn * 2, y + drop * 0.55 + i * 2, 3, (xx, yy, uu) => G_GOLD(0.75 - uu * 0.4, xx, yy)); }
    // leading edge highlight
    P.line(pts[0][0], pts[0][1] - 2, pts[1][0], pts[1][1] - 2, G_FEATHER(0.95, 0, 0)); P.line(pts[1][0], pts[1][1] - 2, pts[2][0], pts[2][1] - 1, G_FEATHER(0.95, 0, 0));
  }
  // body (a vertical capsule, seen from behind) with a saddle cloth
  P.poly([[cx - bodyW * 0.75, baseY - bodyH * 0.45], [cx + bodyW * 0.75, baseY - bodyH * 0.45], [cx + bodyW, baseY + bodyH * 0.2], [cx + bodyW * 0.6, baseY + bodyH * 0.55], [cx - bodyW * 0.6, baseY + bodyH * 0.55], [cx - bodyW, baseY + bodyH * 0.2]], (x, y) => G_FEATHER(0.6 - ((x - cx) / bodyW) * 0.18 * light - ((y - baseY) / bodyH) * 0.2 + ((x * 2 + y) % 5 === 0 ? 0.1 : 0), x, y));
  const sadY = baseY - bodyH * 0.2; P.rect(Math.round(cx - bodyW * 0.95), Math.round(sadY), Math.round(bodyW * 1.9), Math.round(0.35 * S), (x, y) => (((y - sadY) % 4 === 0) ? G_GOLD(0.75, x, y) : ramp(['#5a1612', '#8f2a24', '#c2423a'], 0.22)(0.55 - Math.abs(x - cx) / bodyW * 0.25, x, y)));
  // neck and head (beyond the body, higher; from behind we see the back of the head and the beak tip)
  const neckTop = baseY - bodyH * 0.45 - 0.55 * S; P.limb(cx, baseY - bodyH * 0.4, cx, neckTop, 0.26 * S, (x, y, u, s) => G_WHITE(0.6 - Math.abs(s) * 0.3 - u * 0.1, x, y));
  const hr = 0.3 * S; P.ellipse(cx, neckTop - hr * 0.6, hr, hr * 0.95, (x, y, dx, dy) => (view === 'back' ? G_WHITE(0.65 - dy * 0.3 - dx * 0.15 * light, x, y) : G_WHITE(0.7 - dy * 0.2 - dx * 0.15 * light, x, y)));
  // crest / crown
  P.poly([[cx - hr * 0.8, neckTop - hr * 1.3], [cx + hr * 0.8, neckTop - hr * 1.3], [cx + hr * 0.5, neckTop - hr * 2.1], [cx, neckTop - hr * 2.5], [cx - hr * 0.5, neckTop - hr * 2.1]], (x, y) => G_GOLD(0.5 + (neckTop - hr * 1.3 - y) / hr * 0.3 + ((x + y) % 3 === 0 ? 0.2 : 0), x, y));
  if (view === 'front') { // eyes and beak
    const ey = Math.round(neckTop - hr * 0.7); for (const sgn of [-1, 1]) { P.set(Math.round(cx + sgn * hr * 0.45), ey, INK); P.set(Math.round(cx + sgn * hr * 0.45), ey - 1, hex('#ffd35a')); }
    P.poly([[cx - hr * 0.35, neckTop - hr * 0.45], [cx + hr * 0.35, neckTop - hr * 0.45], [cx, neckTop + hr * 0.35]], (x, y) => G_GOLD(0.85 - (y - (neckTop - hr * 0.45)) / hr * 0.3, x, y));
  } else { // beak tip visible past the head
    P.poly([[cx - hr * 0.2, neckTop - hr * 1.0], [cx + hr * 0.2, neckTop - hr * 1.0], [cx, neckTop - hr * 1.45]], (x, y) => G_GOLD(0.9, x, y));
  }
  // talons tucked under the body
  for (const sgn of [-1, 1]) { const tx = cx + sgn * bodyW * 0.5, ty = baseY + bodyH * 0.5; P.limb(tx, ty, tx + sgn * 2, ty + 0.35 * S, 4, (x, y, u) => G_GOLD(0.8 - u * 0.4, x, y)); }
}

/* ------------------------------------------------------------ atlas + actor */
export interface Atlas { tex: Texture; em: Texture; names: string[]; n: number; canvas: HTMLCanvasElement; fw: number; fh: number }
export type Drawer = (P: PX, E: PX, W: number, H: number, name: string) => void;
/** Draw every named frame into one strip. Alpha is baked with a per-pixel noise in .55..1 so a rising alphaTest dissolves the sprite pixel by pixel. */
export function buildAtlas(names: string[], fw: number, fh: number, draw: Drawer, o: { outline?: number; dissolveNoise?: boolean } = {}): Atlas {
  const n = names.length, P = new PX(fw * n, fh), E = new PX(fw * n, fh); const rnd = mulberry(7);
  names.forEach((name, i) => {
    const p1 = new PX(fw, fh), e1 = new PX(fw, fh); draw(p1, e1, fw, fh, name); p1.outline(o.outline ?? 0.3);
    for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) { const c = p1.get(x, y); if (c) P.set(i * fw + x, y, [c[0], c[1], c[2]], o.dissolveNoise ? 140 + Math.floor(rnd() * 115) : 255); const e = e1.get(x, y); if (e) E.set(i * fw + x, y, [e[0], e[1], e[2]]); }
  });
  const canvas = P.done(); const tex = texOf(canvas), em = texOf(E.done()); tex.repeat.set(1 / n, 1); em.repeat.set(1 / n, 1);
  return { tex, em, names, n, canvas, fw, fh };
}

const _cam = new Vector3(), _wp = new Vector3();
/** A pixel sprite in the world: billboard + contact shadow, frame selection, camera facing, dissolve and hurt tint. */
export class PixelActor {
  root = new Group(); mesh: Mesh; shadow: Mesh; mat: MeshLambertMaterial; private cur = ''; private tex: Texture; private em: Texture;
  /** World-space facing of the character: -1 faces -Z (away from the default camera), +1 faces +Z. */
  facing = -1;
  constructor(public atlas: Atlas, o: { shadowR?: number; emI?: number; emCol?: string; castShadow?: boolean } = {}) {
    // each actor owns its texture offsets, so a pool of actors can show different frames of one atlas
    this.tex = atlas.tex.clone(); this.tex.needsUpdate = true; this.em = atlas.em.clone(); this.em.needsUpdate = true;
    this.mesh = billboard(this.tex, atlas.fw * SPX, atlas.fh * SPX, { em: this.em, emCol: o.emCol ?? '#ffffff', emI: o.emI ?? 1.6, shadow: o.castShadow ?? true });
    this.mat = this.mesh.material as MeshLambertMaterial; this.root.add(this.mesh);
    this.shadow = blob(o.shadowR ?? atlas.fw * SPX * 0.22, 0.5); this.shadow.position.y = 0.01; this.root.add(this.shadow);
    this.mesh.frustumCulled = false;
  }
  frame(name: string) { if (name === this.cur) return; const i = this.atlas.names.indexOf(name); if (i < 0) return; this.cur = name; this.tex.offset.x = this.em.offset.x = i / this.atlas.n; }
  has(name: string) { return this.atlas.names.includes(name); }
  /** True when the camera sees the character's back. */
  seesBack(camera: Object3D) { camera.getWorldPosition(_cam); this.root.getWorldPosition(_wp); const dz = _cam.z - _wp.z; return dz * -this.facing > 0 ? false : true; }
  /** Rotate to face the camera around Y, in the parent's space. */
  face(camera: Object3D, flip = false) {
    camera.getWorldPosition(_cam); this.root.getWorldPosition(_wp);
    let yaw = Math.atan2(_cam.x - _wp.x, _cam.z - _wp.z); let p: Object3D | null = this.root.parent; while (p) { yaw -= p.rotation.y; p = p.parent; }
    this.root.rotation.y = yaw; this.mesh.scale.x = flip ? -1 : 1;
  }
  /** 0 = whole, 1 = gone (needs dissolveNoise in the atlas). */
  dissolve(k: number) { const at = 0.5 + Math.max(0, Math.min(0.5, k * 0.5)) * 0.98; this.mat.alphaTest = at; (this.mesh.customDepthMaterial as MeshDepthMaterial).alphaTest = at; (this.mesh.customDistanceMaterial as MeshDistanceMaterial).alphaTest = at; this.mesh.visible = k < 1; }
  /** A hit flash: tint the sprite toward hot white. */
  hurt(h: number) { this.mat.color.setRGB(1 + h * 1.6, 1 + h * 0.9, 1 + h * 0.6); this.mat.emissiveIntensity = 1.6 + h * 3; }
}

