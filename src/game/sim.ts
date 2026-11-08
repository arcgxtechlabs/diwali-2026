/**
 * The simulation singleton. High-frequency state lives here (never in React state)
 * so the 3D scene can read it every frame without re-rendering.
 * World scale: 1 unit = 1 metre. Garuda flies toward -Z. Camera looks down -Z.
 */
import { Vector3 } from 'three';
import type { Foe, Arrow, Mace, Mark, FloatText } from './types';

export const sim = {
  /** Game time in seconds, slowed by timeScale. */
  t: 0,
  /** Wall-clock delta of the last frame (not slowed). */
  raw: 0,
  /** Slowed delta of the last frame. */
  dt: 0,
  timeScale: 1,
  slowUntil: 0,
  /** How far the world has scrolled past Garuda (metres). */
  scroll: 0,
  /** Current flight speed in m/s (environment scroll). */
  speed: 0,
  levelTime: 0,

  foes: [] as Foe[],
  arrows: [] as Arrow[],
  maces: [] as Mace[],
  marks: [] as Mark[],
  floats: [] as FloatText[],
  nextId: 1,

  garuda: {
    pos: new Vector3(0, 0, 0),
    bank: 0,         // roll in radians, positive banks right
    pitch: 0,
    bob: 0,
    flap: 1,         // 0 glide .. 1 full flapping
    hover: false,
    visible: false,
  },
  boss: {
    pos: new Vector3(0, -2, -34),
    hp: 100,
    hurt: 0,         // seconds left of hurt flash
    swing: 0,        // 0..1 mace swing progress
    swingAt: -9,
    roarAt: -9,
    stompAt: -9,
    throwAt: -9,
    scale: 1,
    dissolve: 0,     // 0..1 during death
  },
  krishna: { draw: 0, shotAt: -9, hitAt: -9, lookAt: new Vector3(0, 0, -40) },
  satya: { draw: 0, shotAt: -9, standing: false, lookAt: new Vector3(0, 0, -40) },
  camera: {
    shake: 0,
    fovKick: 0,
    /** Named shot the CameraRig should ease towards. */
    shot: 'intro' as CameraShot,
    shotAt: 0,
    /** Optional explicit target the shot may use (for example the arrow). */
    focus: new Vector3(),
  },
  dawn: 0,           // 0..1 how far into dawn
  lamps: 0,          // 0..1 how many lamps are lit across the land
  rage: 0,           // 0..1 warm tint
  flash: 0,          // screen-space white flash (consumed by PostFX)
};

export type CameraShot =
  | 'intro'        // slow drift over the city for the name screen
  | 'title'        // sweeping fly-over for the title sequence
  | 'prologue'     // push-in on the fortress and Narakasura's tower
  | 'mount'        // orbit around Krishna and Satyabhama on Garuda as they take off
  | 'ride'         // chase cam behind Garuda
  | 'gates'        // low wide shot of the gates
  | 'bossEnter'    // low-angle hero shot of Narakasura
  | 'battle'       // over-the-shoulder from Garuda toward the boss
  | 'fall'         // close on Krishna as he falls, slow motion
  | 'rise'         // Satyabhama rises, push-in
  | 'final'        // behind Satyabhama, dolly zoom as she draws
  | 'arrow'        // follow the final arrow
  | 'death'        // wide on Narakasura dissolving
  | 'dawn'         // crane up over the city as the sun rises
  | 'finale'       // slow drift under the fireworks
  | 'showcase';    // turntable for the component showcase

export function resetSim() {
  sim.t = 0; sim.timeScale = 1; sim.slowUntil = 0; sim.scroll = 0; sim.speed = 0; sim.levelTime = 0;
  sim.foes.length = 0; sim.arrows.length = 0; sim.maces.length = 0; sim.marks.length = 0; sim.floats.length = 0;
  sim.garuda.pos.set(0, 0, 0); sim.garuda.bank = 0; sim.garuda.pitch = 0; sim.garuda.hover = false; sim.garuda.visible = false; sim.garuda.flap = 1;
  Object.assign(sim.boss, { hp: 100, hurt: 0, swing: 0, swingAt: -9, roarAt: -9, stompAt: -9, throwAt: -9, dissolve: 0 });
  sim.boss.pos.set(0, -2, -34);
  Object.assign(sim.krishna, { draw: 0, shotAt: -9, hitAt: -9 });
  Object.assign(sim.satya, { draw: 0, shotAt: -9, standing: false });
  sim.camera.shake = 0; sim.camera.fovKick = 0; sim.camera.shot = 'intro'; sim.camera.shotAt = 0;
  sim.dawn = 0; sim.lamps = 0; sim.rage = 0; sim.flash = 0;
}

export function shake(a: number) { sim.camera.shake = Math.max(sim.camera.shake, a); }
export function kick(a: number) { sim.camera.fovKick = Math.max(sim.camera.fovKick, a); }
export function flash(a: number) { sim.flash = Math.max(sim.flash, a); }
export function setShot(shot: CameraShot) { if (sim.camera.shot !== shot) { sim.camera.shot = shot; sim.camera.shotAt = sim.t; } }
export function slow(seconds: number) { sim.slowUntil = sim.t + seconds; }
