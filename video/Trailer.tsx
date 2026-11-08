/**
 * The trailer: a 42-second film of the real game rendered with Remotion + @remotion/three.
 * The simulation clock is driven from the Remotion frame so every frame is reproducible,
 * and the story beats are applied from a timeline instead of the interactive director.
 */
import { ThreeCanvas } from '@remotion/three';
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig, useRemotionEnvironment, delayRender, continueRender } from 'remotion';
import { useFrame, useThree } from '@react-three/fiber';
import { Suspense, useEffect, useRef } from 'react';
import { PCFSoftShadowMap, Vector3 } from 'three';
import { Sky } from '../src/scene/Sky';
import { City } from '../src/scene/City';
import { Lighting } from '../src/scene/Lighting';
import { PostFX } from '../src/scene/PostFX';
import { CameraRig } from '../src/scene/CameraRig';
import { GarudaParty, Boss } from '../src/scene/World';
import { Foes } from '../src/characters/Foes';
import { Projectiles } from '../src/vfx/Projectiles';
import { Shockwaves } from '../src/vfx/Shockwaves';
import { Particles } from '../src/vfx/Particles';
import { Diyas } from '../src/vfx/Diyas';
import { sim, resetSim, setShot, shake, kick, flash } from '../src/game/sim';
import { stepSim } from '../src/game/entities';
import { WORLD, MARK_SPOTS, BOSS_HAND } from '../src/game/world';
import { gs, emptyFlags, emptyStats } from '../src/store/gameStore';
import { vfx, PALETTE, FIRE_COLORS } from '../src/vfx/bus';
import { TitleSequence, ChapterCard, Banner, Victory, Finale, Dawn } from '../src/cinematics/compositions';
import type { Flags, Scene } from '../src/game/types';

export const TRAILER_FPS = 30, TRAILER_SECONDS = 42, TRAILER_FRAMES = TRAILER_FPS * TRAILER_SECONDS;
const NAME = 'Suneel';
const _v = new Vector3();
/** Deterministic pseudo-random. */
const rnd = (i: number, salt = 0) => { const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453; return x - Math.floor(x); };

function bossAt(off: readonly [number, number, number]) { return new Vector3(WORLD.bossPos.x + off[0], WORLD.bossPos.y + off[1], WORLD.bossPos.z + off[2]); }
function fireAt(target: Vector3, big = false, shooter: 'Krishna' | 'Satyabhama' = 'Krishna', follow?: (typeof sim.foes)[number]) {
  const base = sim.satya.standing && shooter === 'Satyabhama' ? sim.garuda.pos.clone().add(WORLD.satyaStandOffset).add(_v.set(0, 1.3, -0.3)) : sim.garuda.pos.clone().add(shooter === 'Krishna' ? WORLD.krishnaSeat : WORLD.satyaSeat).add(_v.set(0, 1, -0.4));
  const dist = base.distanceTo(target);
  sim.arrows.push({ id: sim.nextId++, from: base, to: target.clone(), pos: base.clone(), t: 0, dur: big ? 2.1 : Math.max(0.16, dist / 110), big, shooter, follow, onArrive: () => {
    if (follow && !follow.dead) { follow.dead = true; follow.dying = sim.t; vfx.burst(follow.pos, { kind: follow.kind === 'fire' ? 'embers' : 'sparks', count: 36, color: follow.kind === 'fire' ? PALETTE.coral : PALETTE.light, color2: PALETTE.flame, speed: 9, life: 0.9, size: 0.18 }); vfx.flash(follow.pos, PALETTE.flame, 4); }
    else if (!big) { sim.boss.hurt = 0.25; sim.boss.hp = Math.max(0, sim.boss.hp - 4); gs().set({ bossHp: sim.boss.hp }); vfx.burst(target, { kind: 'sparks', count: 26, color: PALETTE.flame, color2: PALETTE.white, speed: 7, life: 0.6, size: 0.16 }); vfx.flash(target, PALETTE.white, 3); shake(0.25); }
  } });
  if (shooter === 'Krishna') { sim.krishna.shotAt = sim.t; sim.krishna.lookAt.copy(target); } else { sim.satya.shotAt = sim.t; sim.satya.lookAt.copy(target); }
  kick(big ? 10 : 2);
}
function spawnFoe(i: number) {
  const kind = rnd(i, 1) < 0.3 ? 'fire' : 'asura'; const pos = new Vector3((rnd(i, 2) - 0.5) * 20, -2 + rnd(i, 3) * 8, WORLD.spawnZ - rnd(i, 4) * 15);
  sim.foes.push({ id: sim.nextId++, kind, pos, vel: new Vector3(0, 0, kind === 'fire' ? 30 : 20), r: kind === 'fire' ? 1.1 : 1.6, phase: rnd(i, 5) * 6, born: sim.t, hp: 1, dead: false, dying: 0, seed: rnd(i, 6) });
}

/** Story beats as a function of trailer time T (seconds). Applied every frame; incremental events fire when prev < t0 <= T. */
function applyTimeline(T: number, prev: number) {
  const s = gs(); const want: Partial<Flags> = {}; let scene: Scene = 'title';
  const ev = (t0: number) => prev < t0 && T >= t0;
  if (T < 5) { scene = 'title'; setShot('title'); sim.speed = 18; sim.garuda.visible = false; }
  else if (T < 9) { scene = 'mount'; want.flightIntro = 5; want.mount = 7; setShot('mount'); sim.speed = 10; sim.garuda.visible = true; }
  else if (T < 16) { scene = 'ride'; want.flightIntro = 5; want.mount = 7; want.rideStart = 9; setShot('ride'); sim.speed = 34; sim.garuda.visible = true; sim.garuda.flap = 1; sim.garuda.hover = false;
    for (let i = 0; i < 14; i++) { const t0 = 9.2 + i * 0.42; if (ev(t0)) spawnFoe(i); }
    for (let i = 0; i < 12; i++) { const t0 = 11.2 + i * 0.38; if (ev(t0)) { const f = sim.foes.filter((q) => !q.dead).sort((a, b) => b.pos.z - a.pos.z)[0]; if (f) fireAt(f.pos, false, 'Krishna', f); } } }
  else if (T < 20) { scene = 'preboss'; Object.assign(want, { flightIntro: 5, mount: 7, rideStart: 9, gatesBreak: 16, bossEnter: 17 }); sim.speed = 0; sim.garuda.hover = true; sim.garuda.flap = 0.7; sim.foes.length = 0; setShot(T < 17 ? 'gates' : 'bossEnter');
    if (ev(16)) { shake(1.2); flash(0.6); vfx.burst(new Vector3(0, 0, -36), { kind: 'debris', count: 80, color: '#6a5248', color2: PALETTE.coral, speed: 16, life: 2.4, size: 0.5, gravity: 14 }); vfx.burst(new Vector3(0, 1, -34), { kind: 'dust', count: 60, color: '#8a7a70', speed: 7, life: 3, size: 3, gravity: -0.5 }); vfx.shockwave(new Vector3(0, 0, -34), { color: PALETTE.flame, radius: 40, duration: 1.4 }); }
    if (ev(18.6)) { sim.boss.roarAt = sim.t; shake(1.2); } }
  else if (T < 24) { scene = 'battle'; Object.assign(want, { flightIntro: 5, mount: 7, rideStart: 9, gatesBreak: 16, bossEnter: 17, battleStart: 20 }); setShot('battle'); sim.garuda.hover = true;
    for (let i = 0; i < 9; i++) { const t0 = 20.4 + i * 0.38; if (ev(t0)) fireAt(bossAt(MARK_SPOTS[i % MARK_SPOTS.length])); }
    if (ev(21.2)) { const from = bossAt(BOSS_HAND); sim.maces.push({ id: sim.nextId++, pos: from.clone(), from, to: sim.garuda.pos.clone().add(_v.set(0.5, -0.4, 0)), t: 0, dur: 2.0, r: 1.2, dead: false }); sim.boss.swingAt = sim.t; }
    if (ev(22.6)) { const m = sim.maces[0]; if (m) { m.dead = true; vfx.burst(m.pos, { kind: 'embers', count: 40, color: PALETTE.coral, color2: PALETTE.flame, speed: 10, life: 0.9, size: 0.25 }); vfx.shockwave(m.pos, { color: PALETTE.coral, radius: 6, duration: 0.5 }); } }
    if (ev(22.0)) sim.boss.stompAt = sim.t; if (ev(22.45)) { shake(0.7); vfx.shockwave(WORLD.bossPos.clone().add(_v.set(0, 0.2, 0)), { color: PALETTE.coral, radius: 30, duration: 1.2 }); } }
  else if (T < 27) { scene = 'fall'; Object.assign(want, { flightIntro: 5, mount: 7, rideStart: 9, gatesBreak: 16, bossEnter: 17, battleStart: 20, krishnaDown: 24 }); setShot('fall'); sim.maces.length = 0; sim.marks.length = 0;
    if (ev(24)) { sim.slowUntil = sim.t + 1.6; shake(1.2); flash(0.6); kick(12); sim.krishna.hitAt = sim.t; sim.boss.throwAt = sim.t - 0.4; const p = sim.garuda.pos.clone().add(WORLD.krishnaSeat).add(_v.set(0, 1, -0.4)); vfx.burst(p, { kind: 'embers', count: 80, color: PALETTE.coral, color2: PALETTE.flame, speed: 12, life: 1.4, size: 0.3 }); vfx.shockwave(p, { color: PALETTE.coral, radius: 12, duration: 0.9 }); }
    if (ev(25.5)) sim.boss.roarAt = sim.t; }
  else if (T < 31) { scene = T < 29 ? 'rage' : 'final'; Object.assign(want, { flightIntro: 5, mount: 7, rideStart: 9, gatesBreak: 16, bossEnter: 17, battleStart: 20, krishnaDown: 24, satyaRise: 27, finalStart: 29 }); sim.satya.standing = true; setShot(T < 29 ? 'rise' : 'final'); s.set({ rage: T < 29 });
    if (ev(27)) sim.rage = 0.01;
    for (let i = 0; i < 4; i++) { const t0 = 28.0 + i * 0.3; if (ev(t0)) fireAt(bossAt(MARK_SPOTS[(i + 2) % MARK_SPOTS.length]), false, 'Satyabhama'); }
    const d = T >= 29 ? Math.min(1, (T - 29) / 1.6) : 0; sim.satya.draw = d; if (s.finalDraw !== d) s.set({ finalDraw: d, drawing: T >= 29 && T < 31 }); }
  else if (T < 34) { scene = 'victory'; Object.assign(want, { flightIntro: 5, mount: 7, rideStart: 9, gatesBreak: 16, bossEnter: 17, battleStart: 20, krishnaDown: 24, satyaRise: 27, finalStart: 29, arrowRelease: 31, bossDeath: 32.6 }); sim.satya.standing = true; setShot(T < 32.6 ? 'arrow' : 'death'); s.set({ rage: false, drawing: false, finalDraw: 1 }); sim.satya.draw = T < 31.1 ? 1 : 0;
    if (ev(31)) { sim.slowUntil = sim.t + 1.6; fireAt(bossAt([0, 6.3, -0.8]), true, 'Satyabhama'); flash(0.3); kick(16); }
    if (ev(32.6)) { const at = bossAt([0, 6.3, -0.8]); flash(1); shake(2.2); for (let k = 0; k < 5; k++) vfx.burst(at.clone().add(_v.set(0, -k * 0.8, 0)), { kind: k === 4 ? 'willow' : 'ring', count: 90, color: FIRE_COLORS[k], speed: 14 + k * 3, life: 2.2, size: 0.3 }); vfx.shockwave(at, { color: PALETTE.white, radius: 60, duration: 1.6 }); vfx.flash(at, PALETTE.white, 30); sim.arrows.length = 0; } }
  else { scene = T < 38 ? 'dawn' : 'finale'; Object.assign(want, { flightIntro: 5, mount: 7, rideStart: 9, gatesBreak: 16, bossEnter: 17, battleStart: 20, krishnaDown: 24, satyaRise: 27, finalStart: 29, arrowRelease: 31, bossDeath: 32.6, dawn: 34, lampsOn: 34, finale: 38 }); sim.satya.standing = true; setShot(T < 38 ? 'dawn' : 'finale'); s.set({ rage: false });
    for (let i = 0; i < 12; i++) { const t0 = 37.5 + i * 0.4; if (ev(t0)) { const pos = new Vector3((rnd(i, 7) - 0.5) * 60, 14 + rnd(i, 8) * 16, -40 - rnd(i, 9) * 30); vfx.firework(pos, { color: FIRE_COLORS[i % FIRE_COLORS.length], kind: i % 3 === 0 ? 'willow' : i % 3 === 1 ? 'ring' : 'peony', count: 160, speed: 13 }); } } }
  if (s.scene !== scene) s.set({ scene });
  const f = s.flags; let changed = false; const next = { ...f };
  for (const k of Object.keys(next) as (keyof Flags)[]) { const v = want[k] ?? 0; if (next[k] !== v) { next[k] = v; changed = true; } }
  if (changed) s.set({ flags: next });
}

/** Drives sim time from the Remotion frame and steps entities once per Remotion frame. */
function TrailerClock() {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const last = useRef(-1);
  useFrame(() => {
    // The frame is advanced twice while rendering (once by @remotion/three, once by <FinalAdvance/> after the
    // post-processing stack is ready). Only the first pass steps the simulation; the second pass is a pure redraw.
    if (last.current === frame) { sim.dt = 0; sim.raw = 0; return; }
    if (last.current < 0 || frame < last.current) { resetSim(); gs().set({ player: NAME, score: 0, lives: 3, bossHp: 100, rage: false, stats: emptyStats(), flags: emptyFlags(), finalDraw: 0, drawing: false, cinematic: null, narration: null, talk: null, hud: null, prompt: null, quality: 'ultra' }); sim.t = 0; }
    const T = frame / fps, prev = last.current < 0 ? -1 : last.current / fps; last.current = frame;
    applyTimeline(T, prev);
    sim.t = T - 1 / fps; stepSim(1 / fps);
  });
  return null;
}

/**
 * @react-three/postprocessing creates its composer inside a useEffect and keeps it in React state, so the
 * single advance() that @remotion/three performs happens before the composer exists (it already owns the
 * render priority, so nothing is drawn). While rendering, hold the frame and advance again once React has
 * flushed, so every frame carries the full post-processing stack.
 */
function FinalAdvance() {
  const { advance } = useThree(); const frame = useCurrentFrame(); const { isRendering } = useRemotionEnvironment();
  useEffect(() => {
    if (!isRendering) return;
    const handle = delayRender(`Post-processing for frame ${frame}`); let cancelled = false;
    const go = () => { if (cancelled) return; advance(performance.now()); requestAnimationFrame(() => { if (cancelled) return; advance(performance.now()); continueRender(handle); }); };
    const id = setTimeout(() => requestAnimationFrame(go), 0);
    return () => { cancelled = true; clearTimeout(id); continueRender(handle); };
  }, [frame, advance, isRendering]);
  return null;
}

function Film() {
  const { width, height } = useVideoConfig();
  return (
    <ThreeCanvas width={width} height={height} dpr={1} shadows={{ type: PCFSoftShadowMap }} gl={{ antialias: false, powerPreference: 'high-performance', stencil: false, preserveDrawingBuffer: true }} camera={{ fov: 46, near: 0.1, far: 900, position: [0, 10, 40] }} style={{ background: '#081A24' }}>
      <Suspense fallback={null}>
        <TrailerClock />
        <Sky /><Lighting quality="ultra" /><City /><Diyas /><GarudaParty /><Boss /><Foes /><Projectiles /><Shockwaves /><Particles />
        <CameraRig /><PostFX quality="ultra" />
        <FinalAdvance />
      </Suspense>
    </ThreeCanvas>
  );
}

export function Trailer() {
  const f = TRAILER_FPS;
  return (
    <AbsoluteFill style={{ background: '#081A24' }}>
      <Film />
      <Sequence from={0} durationInFrames={5 * f} layout="none"><AbsoluteFill><TitleSequence small="ARCGX TECHLABS PRESENTS" big="The Night Before the Lights" /></AbsoluteFill></Sequence>
      <Sequence from={Math.round(9.2 * f)} durationInFrames={Math.round(3 * f)} layout="none"><AbsoluteFill><ChapterCard small="CHAPTER 1" big="The ride of Garuda" /></AbsoluteFill></Sequence>
      <Sequence from={Math.round(20 * f)} durationInFrames={Math.round(2.6 * f)} layout="none"><AbsoluteFill><ChapterCard small="CHAPTER 2" big="Narakasura" /></AbsoluteFill></Sequence>
      <Sequence from={Math.round(27.4 * f)} durationInFrames={Math.round(1.8 * f)} layout="none"><AbsoluteFill><Banner text="Satyabhama takes the bow" accent /></AbsoluteFill></Sequence>
      <Sequence from={Math.round(32.6 * f)} durationInFrames={Math.round(3.2 * f)} layout="none"><AbsoluteFill><Victory text="Narakasura falls" /></AbsoluteFill></Sequence>
      <Sequence from={Math.round(34 * f)} durationInFrames={Math.round(6 * f)} layout="none"><AbsoluteFill><Dawn /></AbsoluteFill></Sequence>
      <Sequence from={Math.round(36.5 * f)} durationInFrames={Math.round(5.5 * f)} layout="none"><AbsoluteFill><Finale name={NAME} /></AbsoluteFill></Sequence>
    </AbsoluteFill>
  );
}
