/**
 * The cast's pose tables and atlases. A pose is data; a new frame is a new table entry.
 * Views: 'back' frames are what the chase camera sees (characters face -Z, away from it);
 * 'front' frames serve the portrait, the mount orbit, victory and Narakasura (who faces +Z).
 */
import { PX } from './px';
import { buildAtlas, drawHumanoid, drawGaruda, frameSize, COSTUMES, GARUDA, type Pose2, type Atlas, type Costume } from './figure';
import { SPX } from './px';

const down = { a: 0, b: 0 };
const stand = { legA: { a: -0.06 }, legB: { a: 0.06 } };
const seated = { sit: true, crouch: 0.12, legA: { a: -1.3, b: 1.15 }, legB: { a: 1.3, b: -1.15 } };
/** Archer from behind: bow in the screen-right hand (the character's left), the draw hand folds back toward the cheek. */
const aimBack = (draw: number, glow = false): Partial<Pose2> => ({ view: 'back', armB: { a: 1.25 + draw * 0.1, b: 0, f: 0.42 }, armA: { a: -1.35 - draw * 0.55, b: 1.5 + draw * 0.9, f: 0.85 }, bow: { hand: 'B', draw, glow }, lean: 1 });

export const KRISHNA: Record<string, Pose2> = {
  idle0: { view: 'front', armA: { a: -0.18, b: 0.12 }, armB: { a: 0.18, b: -0.12 }, ...stand },
  idle1: { view: 'front', bob: 1, armA: { a: -0.16, b: 0.14 }, armB: { a: 0.2, b: -0.1 }, ...stand },
  blink: { view: 'front', armA: { a: -0.18, b: 0.12 }, armB: { a: 0.18, b: -0.12 }, ...stand, eyes: 'blink' },
  portrait: { view: 'front', armA: { a: -0.18, b: 0.12 }, armB: { a: 0.18, b: -0.12 }, ...stand },
  ride0: { view: 'back', ...seated, armA: { a: -0.3, b: 0.2, f: 0.55 }, armB: { a: 0.3, b: -0.2, f: 0.55 } },
  ride1: { view: 'back', bob: 1, ...seated, armA: { a: -0.28, b: 0.22, f: 0.55 }, armB: { a: 0.32, b: -0.18, f: 0.55 } },
  rideF0: { view: 'front', ...seated, armA: { a: -0.3, b: 0.2, f: 0.55 }, armB: { a: 0.3, b: -0.2, f: 0.55 } },
  rideF1: { view: 'front', bob: 1, ...seated, armA: { a: -0.28, b: 0.22, f: 0.55 }, armB: { a: 0.32, b: -0.18, f: 0.55 } },
  aim0: { ...seated, ...aimBack(0), view: 'back' } as Pose2, aim1: { ...seated, ...aimBack(0.35), view: 'back' } as Pose2, aim2: { ...seated, ...aimBack(0.7), view: 'back' } as Pose2, aim3: { ...seated, ...aimBack(1), view: 'back' } as Pose2,
  shoot: { view: 'back', ...seated, armB: { a: 1.3, f: 0.4 }, armA: { a: -1.1, b: 0.6, f: 0.8 }, bow: { hand: 'B', draw: 0 }, lean: 1 },
  fallen: { view: 'front', crouch: 0.3, armA: { a: -0.9, b: 0.3 }, armB: { a: 0.7, b: 0.4 }, legA: { a: -0.3, b: 0.4 }, legB: { a: 0.35, b: 0.2 }, eyes: 'closed', headX: 2, limp: true },
  victory: { view: 'front', armA: { a: -2.6, b: -0.3 }, armB: { a: 2.6, b: 0.3 }, legA: { a: -0.15 }, legB: { a: 0.15 }, mouth: 'open' },
};
export const SATYABHAMA: Record<string, Pose2> = {
  idle0: { view: 'front', armA: { a: -0.16, b: 0.1 }, armB: { a: 0.16, b: -0.1 }, ...stand },
  idle1: { view: 'front', bob: 1, armA: { a: -0.14, b: 0.12 }, armB: { a: 0.18, b: -0.08 }, ...stand },
  blink: { view: 'front', armA: { a: -0.16, b: 0.1 }, armB: { a: 0.16, b: -0.1 }, ...stand, eyes: 'blink' },
  portrait: { view: 'front', armA: { a: -0.16, b: 0.1 }, armB: { a: 0.16, b: -0.1 }, ...stand },
  ride0: { view: 'back', ...seated, armA: { a: -0.35, b: 0.3, f: 0.5 }, armB: { a: 0.35, b: -0.3, f: 0.5 } },
  ride1: { view: 'back', bob: 1, ...seated, armA: { a: -0.33, b: 0.32, f: 0.5 }, armB: { a: 0.37, b: -0.28, f: 0.5 } },
  rideF0: { view: 'front', ...seated, armA: { a: -0.35, b: 0.3, f: 0.5 }, armB: { a: 0.35, b: -0.3, f: 0.5 } },
  rideF1: { view: 'front', bob: 1, ...seated, armA: { a: -0.33, b: 0.32, f: 0.5 }, armB: { a: 0.37, b: -0.28, f: 0.5 } },
  rise0: { view: 'back', crouch: 0.65, kneel: 'A', legA: down, legB: { a: 0.3, b: -0.9 }, armA: { a: -0.5, b: 0.6 }, armB: { a: 0.6, b: -0.4, f: 0.7 }, lean: -1 },
  rise1: { view: 'back', crouch: 0.3, legA: { a: -0.25, b: 0.4 }, legB: { a: 0.3, b: -0.5 }, armA: { a: -0.4, b: 0.3 }, armB: { a: 0.5, b: -0.3, f: 0.8 } },
  stand0: { view: 'back', legA: { a: -0.22 }, legB: { a: 0.22 }, armA: { a: -0.35, b: 0.25 }, armB: { a: 0.5, b: -0.1 }, bow: { hand: 'B', draw: 0 } },
  stand1: { view: 'back', bob: 1, legA: { a: -0.22 }, legB: { a: 0.22 }, armA: { a: -0.33, b: 0.27 }, armB: { a: 0.5, b: -0.1 }, bow: { hand: 'B', draw: 0 } },
  aim0: { ...aimBack(0), legA: { a: -0.25 }, legB: { a: 0.28 }, view: 'back' } as Pose2, aim1: { ...aimBack(0.35), legA: { a: -0.25 }, legB: { a: 0.28 }, view: 'back' } as Pose2,
  aim2: { ...aimBack(0.7), legA: { a: -0.25 }, legB: { a: 0.28 }, view: 'back' } as Pose2, aim3: { ...aimBack(1, true), legA: { a: -0.25 }, legB: { a: 0.28 }, view: 'back' } as Pose2,
  shoot: { view: 'back', legA: { a: -0.25 }, legB: { a: 0.28 }, armB: { a: 1.3, f: 0.4 }, armA: { a: -1.1, b: 0.6, f: 0.8 }, bow: { hand: 'B', draw: 0, glow: true }, lean: 1 },
  victory: { view: 'front', armA: { a: -2.6, b: -0.3 }, armB: { a: 2.6, b: 0.3 }, legA: { a: -0.15 }, legB: { a: 0.15 }, mouth: 'open' },
};
const maceDown = { armB: { a: 0.22, b: 0.05 }, mace: 'B' as const };
export const NARAKASURA: Record<string, Pose2> = {
  idle0: { view: 'front', armA: { a: -0.45, b: 0.3 }, ...maceDown, legA: { a: -0.2 }, legB: { a: 0.2 }, eyes: 'glow', mouth: 'calm', crouch: 0.05 },
  idle1: { view: 'front', bob: 2, armA: { a: -0.42, b: 0.34 }, ...maceDown, legA: { a: -0.2 }, legB: { a: 0.2 }, eyes: 'glow', mouth: 'calm', crouch: 0.03 },
  roar: { view: 'front', armA: { a: -2.3, b: -0.5 }, armB: { a: 2.4, b: 0.4 }, mace: 'B', legA: { a: -0.28 }, legB: { a: 0.28 }, eyes: 'glow', mouth: 'roar', headY: 3, lean: 0 },
  swing0: { view: 'front', armA: { a: -0.8, b: 0.6 }, armB: { a: 2.9, b: -0.5 }, mace: 'B', legA: { a: -0.25 }, legB: { a: 0.3 }, eyes: 'glow', mouth: 'open', crouch: 0.05 },
  swing1: { view: 'front', armA: { a: -1.0, b: 0.5 }, armB: { a: 1.7, b: -0.4, f: 0.9 }, mace: 'B', legA: { a: -0.25 }, legB: { a: 0.3 }, eyes: 'glow', mouth: 'roar', crouch: 0.15, lean: -2 },
  swing2: { view: 'front', armA: { a: -1.2, b: 0.4 }, armB: { a: 0.55, b: -0.3, f: 0.6 }, mace: 'B', legA: { a: -0.3 }, legB: { a: 0.35 }, eyes: 'glow', mouth: 'roar', crouch: 0.3, lean: -3 },
  throw0: { view: 'front', armA: { a: -2.5, b: -0.6 }, ...maceDown, legA: { a: -0.25 }, legB: { a: 0.3 }, eyes: 'glow', mouth: 'open', lean: 2 },
  throw1: { view: 'front', armA: { a: -0.9, b: 0.1, f: 0.45 }, ...maceDown, legA: { a: -0.3 }, legB: { a: 0.3 }, eyes: 'glow', mouth: 'roar', lean: -3, crouch: 0.15 },
  stomp0: { view: 'front', armA: { a: -1.2, b: 0.5 }, armB: { a: 1.0, b: -0.2 }, mace: 'B', legA: { a: -0.95, b: 1.5 }, legB: { a: 0.1 }, eyes: 'glow', mouth: 'open', crouch: 0.1 },
  stomp1: { view: 'front', armA: { a: -0.9, b: 0.5 }, armB: { a: 0.8, b: -0.2 }, mace: 'B', legA: { a: -0.35, b: 0.3 }, legB: { a: 0.3, b: -0.2 }, eyes: 'glow', mouth: 'roar', crouch: 0.35 },
  hurt: { view: 'front', armA: { a: -1.4, b: 0.2 }, armB: { a: 1.1, b: 0.2 }, mace: 'B', legA: { a: -0.3 }, legB: { a: 0.3 }, eyes: 'glow', mouth: 'roar', lean: 3, headY: 2 },
  death0: { view: 'front', crouch: 0.55, kneel: 'A', legA: down, legB: { a: 0.35, b: -0.8 }, armA: { a: -0.7, b: 0.4 }, armB: { a: 0.9, b: 0.1 }, mace: 'B', eyes: 'glow', mouth: 'open', headY: -3 },
  death1: { view: 'front', crouch: 0.85, kneel: 'A', legA: down, legB: { a: 0.4, b: -0.9 }, armA: { a: -0.3, b: 0.2 }, armB: { a: 0.3, b: 0.1 }, eyes: 'closed', mouth: 'calm', headY: -6, limp: true },
};
export const ASURA: Record<string, Pose2> = {
  fly0: { view: 'front', wings: 0.15, armA: { a: -1.4, b: 0.4 }, armB: { a: 1.4, b: -0.4 }, legA: { a: -0.5, b: 0.5, f: 0.7 }, legB: { a: 0.5, b: -0.5, f: 0.7 }, eyes: 'glow', mouth: 'roar' },
  fly1: { view: 'front', wings: 0.95, bob: 2, armA: { a: -1.6, b: 0.3 }, armB: { a: 1.6, b: -0.3 }, legA: { a: -0.35, b: 0.7, f: 0.7 }, legB: { a: 0.35, b: -0.7, f: 0.7 }, eyes: 'glow', mouth: 'roar' },
  fly2: { view: 'front', wings: 0.55, bob: 1, armA: { a: -1.5, b: 0.35 }, armB: { a: 1.5, b: -0.35 }, legA: { a: -0.45, b: 0.6, f: 0.7 }, legB: { a: 0.45, b: -0.6, f: 0.7 }, eyes: 'glow', mouth: 'open' },
};

const cache = new Map<string, Atlas>();
function humanAtlas(key: string, costume: Costume, table: Record<string, Pose2>, size?: { w: number; h: number }, dissolve = false) {
  const hit = cache.get(key); if (hit) return hit;
  const fs = size ?? frameSize(costume); const S = 1 / SPX;
  const atlas = buildAtlas(Object.keys(table), fs.w, fs.h, (P: PX, E: PX, W, H, name) => { drawHumanoid({ P, E, W, H, S, c: costume, pose: table[name], light: 1 }); }, { dissolveNoise: dissolve });
  cache.set(key, atlas); return atlas;
}
export const krishnaAtlas = () => humanAtlas('krishna', COSTUMES.krishna, KRISHNA);
export const satyabhamaAtlas = () => humanAtlas('satyabhama', COSTUMES.satyabhama, SATYABHAMA);
export const narakasuraAtlas = () => humanAtlas('narakasura', COSTUMES.narakasura, NARAKASURA, { w: 290, h: 440 }, true);
export const asuraAtlas = () => humanAtlas('asura', COSTUMES.asura, ASURA, { w: 72, h: 66 });

/** Garuda's wing cycle: b* seen from behind, f* from the front; glide holds the wings level. */
export const GARUDA_FRAMES = { back: ['b0', 'b1', 'b2', 'b3'], front: ['f0', 'f1', 'f2', 'f3'], glide: 'g0', glideF: 'g1' };
const FLAP = [0.85, 0.25, -0.65, 0.25];
export function garudaAtlas() {
  const hit = cache.get('garuda'); if (hit) return hit;
  const W = Math.round(GARUDA.w / SPX), H = Math.round(GARUDA.h / SPX);
  const names = [...GARUDA_FRAMES.back, ...GARUDA_FRAMES.front, GARUDA_FRAMES.glide, GARUDA_FRAMES.glideF];
  const atlas = buildAtlas(names, W, H, (P, E, w, h, name) => { const i = Number(name[1]); if (name[0] === 'b') drawGaruda(P, E, w, h, FLAP[i], 'back'); else if (name[0] === 'f') drawGaruda(P, E, w, h, FLAP[i], 'front'); else drawGaruda(P, E, w, h, 0.1, i === 0 ? 'back' : 'front'); });
  cache.set('garuda', atlas); return atlas;
}
/** Which frame of a 4-step cycle plays at time t and rate fps. */
export const cycle = (t: number, fps: number, n = 4) => Math.floor(t * fps) % n;
/** Two-frame idle at ~1.4 Hz, with a blink every few seconds when a blink frame exists. */
export function idleFrame(t: number, base: [string, string], blink?: string) { if (blink && (t % 4.3) < 0.14) return blink; return base[Math.floor(t * 1.4) % 2]; }
