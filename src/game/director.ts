/**
 * The Director: runs the story as an async sequence and owns the gameplay rules.
 * It writes to the zustand store (for the UI and declarative scene state) and to
 * `sim` (for per-frame state). It never touches THREE objects directly.
 */
import { Vector3 } from 'three';
import { useGameStore, gs, emptyStats, emptyFlags, store } from '@/store/gameStore';
import { sim, resetSim, shake, kick, flash, setShot, slow } from './sim';
import { WORLD, BOSS_HITBOXES, MARK_SPOTS, BOSS_HAND } from './world';
import type { Scene, Foe, NarrationLine, Companion, CinematicId, Flags } from './types';
import { vfx, PALETTE, FIRE_COLORS } from '@/vfx/bus';
import { audio, NOTES } from '@/audio/engine';
import { targeting } from './targeting';

const RIDE_LENGTH = 32; // seconds of chapter 1
let timers: number[] = [];
const later = (ms: number, fn: () => void) => { const id = window.setTimeout(fn, ms); timers.push(id); return id; };
const wait = (ms: number) => new Promise<void>((r) => later(ms, r));
export const fmt = (n: number) => Math.round(n).toLocaleString('en-US');
let cinematicKey = 1;
let lastHit = -9, combo = 1, levelTime = 0, foeT = 0, markT = 0, maceT = 0, stompT = 0, bossSwing = 0, fallDone = false, rage = false, battleStart = 0;
const _v = new Vector3(), _w = new Vector3();

function setScene(s: Scene) { gs().set({ scene: s }); }
function flagNow(name: keyof Flags) { gs().flag(name, sim.t); }
function hud(level: string | null, stat = '') { gs().set({ hud: level ? { level, stat } : null }); }
function prompt(text: string, hot = false) { gs().set({ prompt: text ? { text, hot } : null }); }
function toast(text: string) { gs().set({ toast: text }); later(2400, () => { if (gs().toast === text) gs().set({ toast: '' }); }); }

/** Play a Remotion cinematic overlay and resolve when it ends. */
export function cinematic(id: CinematicId, props: Record<string, unknown> = {}, seconds = 3, loop = false): Promise<void> {
  const durationInFrames = Math.round(seconds * 30);
  gs().set({ cinematic: { id, key: cinematicKey++, props, durationInFrames, loop } });
  if (loop) return Promise.resolve();
  return new Promise((res) => later(seconds * 1000, () => { const c = gs().cinematic; if (c && c.id === id) gs().set({ cinematic: null }); res(); }));
}
export function stopCinematic() { gs().set({ cinematic: null }); }
function narrate(lines: NarrationLine[]): Promise<void> { return new Promise((resolve) => gs().set({ narration: { lines, resolve } })); }
function speak(who: Companion, lines: string[], label: string): Promise<void> { audio.phrase('greet'); return new Promise((resolve) => gs().set({ talk: { who, lines, label, resolve } })); }

function addScore(n: number, at?: Vector3, label?: string) {
  const s = gs(); s.set({ score: s.score + n });
  if (at) sim.floats.push({ id: sim.nextId++, pos: at.clone(), text: label || `+${fmt(n)}`, color: PALETTE.flame, t: 0 });
}
function bumpCombo(win: number) { combo = sim.t - lastHit < win ? Math.min(8, combo + 1) : 1; lastHit = sim.t; const st = gs().stats; if (combo > st.bestCombo) gs().set({ stats: { ...st, bestCombo: combo } }); gs().set({ combo }); return combo; }
function stat(patch: Partial<ReturnType<typeof emptyStats>>) { gs().set({ stats: { ...gs().stats, ...patch } }); }

/* ------------------------------------------------------------------ story */
export async function start(name: string) {
  clearAll(); resetSim();
  const s = gs();
  s.set({ player: name, score: 0, combo: 1, lives: 3, bossHp: 100, rage: false, stats: emptyStats(), flags: emptyFlags(), finalDraw: 0, drawing: false });
  store.set('arcgx-diwali-name', name);
  audio.init(); audio.resume(); audio.mood(0);
  combo = 1; lastHit = -9; fallDone = false; rage = false;
  setScene('title'); setShot('title'); sim.speed = 18;
  await wait(400);
  audio.chord([73.42, 110, 146.83], 0.25, 6);
  await cinematic('title', { small: 'ARCGX TECHLABS PRESENTS', big: 'The Night Before the Lights' }, gs().reduceMotion ? 2.5 : 5.2);
  if (gs().scene !== 'title') return;
  setScene('prologue'); setShot('prologue'); sim.speed = 6;
  await narrate([
    { who: 'Narrator', text: 'Long ago, in the fortress city of Pragjyotisha, the demon king Narakasura ruled with fear.' },
    { who: 'Narrator', text: 'He stole the earrings of Aditi, mother of the gods, and held sixteen thousand princesses captive behind his walls.' },
    { who: 'Narrator', text: 'A boon protected him: no one could end his life except his own mother, Bhudevi, the Earth.' },
    { who: 'Narrator', text: 'So Krishna turned to his wife Satyabhama, born of the Earth herself. Together they climbed onto Garuda and flew towards the fortress.', at: () => { flagNow('flightIntro'); sim.garuda.visible = true; setShot('mount'); audio.wings(); } },
  ]);
  if (gs().scene !== 'prologue') return;
  setScene('mount'); flagNow('mount'); setShot('mount'); sim.speed = 10;
  await wait(gs().reduceMotion ? 800 : 2600);
  await speak('Krishna', [`${name}, the walls are ahead. His asuras will come at us from the sky.`, 'Tap them before they reach Garuda. Keep our three lamps burning.'], 'Ride');
  await cinematic('chapter', { small: 'CHAPTER 1', big: 'The ride of Garuda' }, gs().reduceMotion ? 1.6 : 3.2);
  ride();
}

/* -------------------------------------------------------------- chapter 1 */
function ride() {
  setScene('ride'); flagNow('rideStart'); setShot('ride'); sim.garuda.hover = false; sim.garuda.flap = 1; sim.speed = 34;
  levelTime = 0; foeT = 1.2; audio.startBeat(118); audio.wings(); audio.mood(0.5);
  hud('<b>Chapter 1</b>The ride of Garuda', 'Struck down <span class="num">0</span>'); prompt('Tap the asuras before they reach Garuda');
  later(2800, () => { if (gs().scene === 'ride') prompt(''); });
}
function spawnFoe() {
  const kind: Foe['kind'] = Math.random() < 0.3 ? 'fire' : 'asura';
  const x = (Math.random() - 0.5) * 22, y = -3 + Math.random() * 9;
  const pos = new Vector3(x, y, WORLD.spawnZ - Math.random() * 20);
  const speed = (kind === 'fire' ? 30 : 19) * (1 + levelTime * 0.015);
  sim.foes.push({ id: sim.nextId++, kind, pos, vel: new Vector3(0, 0, speed), r: kind === 'fire' ? 1.1 : 1.6, phase: Math.random() * 6, born: sim.t, hp: 1, dead: false, dying: 0, seed: Math.random() });
}
function companionPos(who: Companion, out = new Vector3()) {
  if (who === 'Satyabhama' && sim.satya.standing) return out.copy(sim.garuda.pos).add(WORLD.satyaStandOffset).add(_w.set(0, 1.3, -0.3));
  return out.copy(sim.garuda.pos).add(who === 'Krishna' ? WORLD.krishnaSeat : WORLD.satyaSeat).add(_w.set(0, 1.0, -0.4));
}
function fireArrow(to: Vector3, shooter: Companion, big: boolean, onArrive?: () => void, follow?: Foe) {
  const from = companionPos(shooter);
  const dist = from.distanceTo(to);
  const a = { id: sim.nextId++, from: from.clone(), to: to.clone(), pos: from.clone(), t: 0, dur: big ? 2.1 : Math.max(0.16, dist / 110), big, onArrive, shooter, follow };
  sim.arrows.push(a);
  if (shooter === 'Krishna') { sim.krishna.shotAt = sim.t; sim.krishna.draw = 0; } else { sim.satya.shotAt = sim.t; sim.satya.draw = 0; }
  audio.arrow(to.x / 12); stat({ shots: gs().stats.shots + 1 }); kick(big ? 10 : 2);
}

/** Chapter 1 shot: pick the foe nearest the tap in screen space (homing), else fly to the point in the far plane. */
function shootAt(px: number, py: number) {
  const target = targeting.pickFoe(px, py, sim.foes, 52);
  const shooter: Companion = 'Krishna';
  if (target) { sim.krishna.lookAt.copy(target.pos); fireArrow(target.pos, shooter, false, () => { if (!target.dead) killFoe(target); else miss(target.pos); }, target); }
  else { const p = targeting.unproject(px, py, -60); sim.krishna.lookAt.copy(p); fireArrow(p, shooter, false, () => { const f = sim.foes.find((q) => !q.dead && q.pos.distanceTo(p) < q.r + 2.2); if (f) killFoe(f); else miss(p); }); }
}
function miss(p: Vector3) { combo = 1; gs().set({ combo }); vfx.burst(p, { kind: 'sparks', count: 6, color: PALETTE.light, speed: 3, life: 0.35, size: 0.12 }); }
function killFoe(f: Foe) {
  f.dead = true; f.dying = sim.t; const st = gs().stats; stat({ kills: st.kills + 1, hits: st.hits + 1 });
  const c = bumpCombo(1.0), pts = (f.kind === 'fire' ? 150 : 100) * c;
  addScore(pts, f.pos.clone().add(_w.set(0, f.r + 0.5, 0)), c > 1 ? `+${pts}  x${c}` : `+${pts}`);
  vfx.burst(f.pos, { kind: f.kind === 'fire' ? 'embers' : 'sparks', count: gs().reduceMotion ? 12 : 36, color: f.kind === 'fire' ? PALETTE.coral : PALETTE.light, color2: PALETTE.flame, speed: 9, life: 0.9, size: 0.18 });
  vfx.flash(f.pos, PALETTE.flame, 4); if (f.kind === 'fire') vfx.shockwave(f.pos, { color: PALETTE.coral, radius: 4, duration: 0.5 });
  audio.whoosh(f.pos.x / 12); audio.pluck(NOTES[Math.min(10, 2 + c)], 0.1, f.pos.x / 12);
  hud('<b>Chapter 1</b>The ride of Garuda', `Struck down <span class="num">${st.kills + 1}</span>${c > 1 ? `  Combo <span class="num">x${c}</span>` : ''}`);
}
export function loseLamp(at: Vector3) {
  const s = gs(); const lives = Math.max(0, s.lives - 1); s.set({ lives, combo: 1 }); stat({ lives }); combo = 1;
  shake(0.6); audio.thud(0); flash(0.35); kick(6);
  vfx.burst(at, { kind: 'embers', count: 30, color: PALETTE.coral, speed: 7, life: 0.8, size: 0.2 }); vfx.shockwave(at, { color: PALETTE.coral, radius: 5, duration: 0.6 });
  if (s.scene === 'ride') hud('<b>Chapter 1</b>The ride of Garuda', `Struck down <span class="num">${s.stats.kills}</span>`); else hud('<b>Chapter 2</b>Narakasura', `On target <span class="num">${s.stats.hits}</span>`);
  if (lives === 0) { s.set({ lives: 1 }); stat({ lives: 0 }); cinematic('banner', { text: 'Krishna relights a lamp' }, 1.4); }
}
async function endRide() {
  if (gs().scene !== 'ride') return;
  setScene('preboss'); audio.stopBeat(); sim.foes.length = 0; hud(null); prompt(''); sim.speed = 14;
  const lives = gs().lives; addScore(lives * 500);
  await cinematic('banner', { text: `Through the gates  +${fmt(lives * 500)}` }, 1.8);
  // approach: slow down, gates ahead
  setShot('gates'); sim.garuda.flap = 0.4;
  await wait(1200);
  flagNow('gatesBreak'); audio.shatter(0); shake(1.2); flash(0.6); kick(8); sim.speed = 0; sim.garuda.hover = true; sim.garuda.flap = 0.7;
  vfx.burst(new Vector3(0, 0, -36), { kind: 'debris', count: 80, color: '#6a5248', color2: PALETTE.coral, speed: 16, life: 2.4, size: 0.5, gravity: 14 });
  vfx.burst(new Vector3(0, 1, -34), { kind: 'dust', count: 60, color: '#8a7a70', speed: 7, life: 3, size: 3, gravity: -0.5 });
  vfx.shockwave(new Vector3(0, 0, -34), { color: PALETTE.flame, radius: 40, duration: 1.4 });
  await cinematic('gates', {}, 1.6);
  await narrate([
    { who: 'Narrator', text: 'The gates of Pragjyotisha shattered. And out of the smoke came Narakasura himself, his mace heavy with the night.', at: () => { flagNow('bossEnter'); setShot('bossEnter'); sim.boss.roarAt = sim.t + 1.6; later(1600, () => { audio.roar(); shake(1.4); }); audio.mood(0.8); } },
    { who: 'Narakasura', text: 'Who dares fly into my city? No arrow of yours can touch me, Krishna.' },
    { who: 'Krishna', text: `Then it will not be my arrow. ${gs().player}, aim for the glowing marks. When he throws his fire, break it.` },
  ]);
  battle();
}

/* -------------------------------------------------------------- chapter 2 */
function battle() {
  setScene('battle'); flagNow('battleStart'); setShot('battle'); battleStart = sim.t;
  sim.boss.hp = 100; gs().set({ bossHp: 100 }); markT = 1.0; maceT = 2.6; stompT = 7; rage = false; fallDone = false; sim.garuda.hover = true;
  audio.startBeat(126, ['dha', 'na', 'dha', 'na', 'ge', 'na', 'tin', 'tin']); audio.mood(1);
  hud('<b>Chapter 2</b>Narakasura', `On target <span class="num">${gs().stats.hits}</span>`); prompt('Tap Narakasura. Glowing marks hit harder.');
  later(3200, () => { if (gs().scene === 'battle') prompt(''); });
}
export function bossWorld(offset: [number, number, number], out = new Vector3()) { const s = sim.boss.scale; return out.set(WORLD.bossPos.x + offset[0] * s, WORLD.bossPos.y + offset[1] * s, WORLD.bossPos.z + offset[2] * s); }
function hitNaraka(at: Vector3, dmg: number, label?: string) {
  if (sim.boss.hp <= 0) return;
  const hp = Math.max(0, sim.boss.hp - dmg * (rage ? 2 : 1)); sim.boss.hp = hp; sim.boss.hurt = 0.25; gs().set({ bossHp: hp });
  const st = gs().stats; stat({ hits: st.hits + 1 });
  const c = bumpCombo(1.2), pts = Math.round(dmg * 25 * c * (rage ? 2 : 1));
  addScore(pts, at, label ? `${label} +${fmt(pts)}` : c > 1 ? `+${pts}  x${c}` : `+${pts}`);
  vfx.burst(at, { kind: 'sparks', count: gs().reduceMotion ? 10 : 26, color: PALETTE.flame, color2: PALETTE.white, speed: 7, life: 0.6, size: 0.16 }); vfx.flash(at, PALETTE.white, 3);
  audio.thud(at.x / 12, dmg > 3); shake(dmg > 3 ? 0.5 : 0.2); kick(dmg > 3 ? 4 : 1.5);
  hud('<b>Chapter 2</b>Narakasura', `On target <span class="num">${st.hits + 1}</span>${c > 1 ? `  Combo <span class="num">x${c}</span>` : ''}`);
  if (hp <= 50 && !fallDone) { fallDone = true; krishnaFalls(); return; }
  if (hp <= 14 && gs().scene === 'rage') finalPhase();
}
function battleShoot(px: number, py: number) {
  const shooter: Companion = sim.satya.standing ? 'Satyabhama' : 'Krishna';
  // maces first, then marks, then the body
  const mace = targeting.pickMace(px, py, sim.maces, 70);
  if (mace) { const look = shooter === 'Krishna' ? sim.krishna.lookAt : sim.satya.lookAt; look.copy(mace.pos); fireArrow(mace.pos, shooter, false, () => { if (mace.dead) return; mace.dead = true; stat({ maces: gs().stats.maces + 1, hits: gs().stats.hits + 1 }); vfx.burst(mace.pos, { kind: 'embers', count: 40, color: PALETTE.coral, color2: PALETTE.flame, speed: 10, life: 0.9, size: 0.25 }); vfx.shockwave(mace.pos, { color: PALETTE.coral, radius: 6, duration: 0.5 }); addScore(120, mace.pos.clone().add(_w.set(0, 1, 0)), 'Broken +120'); audio.whoosh(0.4); audio.crackle(0.3); }, undefined); return; }
  const mark = targeting.pickMark(px, py, sim.marks, 60);
  const look = shooter === 'Krishna' ? sim.krishna.lookAt : sim.satya.lookAt;
  if (mark) { const p = bossWorld([mark.offset.x, mark.offset.y, mark.offset.z]); look.copy(p); fireArrow(p, shooter, false, () => { if (mark.hit) { hitNaraka(p, 2); return; } mark.hit = true; mark.hitT = sim.t; stat({ marks: gs().stats.marks + 1 }); vfx.flash(p, PALETTE.white, 6); vfx.shockwave(p, { color: PALETTE.white, radius: 5, duration: 0.4 }); hitNaraka(p, 9, 'Mark'); }); return; }
  const box = targeting.pickBossBox(px, py, 40);
  if (box) { const p = bossWorld(box.offset); look.copy(p); fireArrow(p, shooter, false, () => hitNaraka(p, box.weak ? 3 : 2)); return; }
  const p = targeting.unproject(px, py, WORLD.bossPos.z); look.copy(p); fireArrow(p, shooter, false, () => miss(p));
}
async function krishnaFalls() {
  setScene('fall'); flagNow('krishnaDown'); setShot('fall'); audio.stopBeat(); prompt(''); sim.maces.length = 0; sim.marks.length = 0;
  slow(1.6); shake(1.2); flash(0.6); kick(12); audio.boom(-0.4, true); audio.roar(); sim.krishna.hitAt = sim.t; sim.boss.throwAt = sim.t - 0.4;
  companionPos('Krishna', _v); vfx.burst(_v, { kind: 'embers', count: 80, color: PALETTE.coral, color2: PALETTE.flame, speed: 12, life: 1.4, size: 0.3 }); vfx.shockwave(_v, { color: PALETTE.coral, radius: 12, duration: 0.9 });
  cinematic('krishnaFalls', {}, 3.4);
  await wait(1800);
  await narrate([
    { who: 'Narrator', text: 'Narakasura hurled his fire. The blast struck Krishna, and he fell across Garuda’s wings.' },
    { who: 'Narakasura', text: 'See? Even Krishna falls before me.', at: () => { sim.boss.roarAt = sim.t; audio.roar(); } },
    { who: 'Narrator', text: 'Then Satyabhama rose. She took the bow from Krishna’s hands. The Earth herself would end him.', at: () => { flagNow('satyaRise'); sim.satya.standing = true; setShot('rise'); audio.chord([220, 293.66, 369.99, 440], 0.3, 4); audio.phrase('sad'); } },
  ]);
  await speak('Satyabhama', [`${gs().player}, my arrows carry the strength of the Earth now. Nothing he throws will stop us.`, 'Aim true. Every hit counts double.'], 'Fight');
  setScene('rage'); setShot('battle'); rage = true; gs().set({ rage: true }); markT = 0.6; maceT = 1.8; stompT = 5;
  audio.startBeat(138, ['dha', 'dha', 'na', 'dha', 'ge', 'na', 'tin', 'na']);
  cinematic('banner', { text: 'Satyabhama takes the bow', accent: true }, 1.8);
  hud('<b>Chapter 2</b>Narakasura', `On target <span class="num">${gs().stats.hits}</span>`);
}
function finalPhase() {
  setScene('final'); flagNow('finalStart'); setShot('final'); audio.stopBeat(); sim.maces.length = 0; sim.marks.length = 0; slow(1.0);
  prompt('Press and hold to draw the final arrow, then release', true);
  cinematic('banner', { text: 'The final arrow', accent: true }, 1.6);
  audio.chord([146.83, 220, 293.66], 0.25, 5);
}
let drawStartedAt = 0;
export function beginDraw() { if (gs().scene !== 'final' || gs().drawing) return; drawStartedAt = performance.now(); gs().set({ drawing: true, finalDraw: 0 }); sim.satya.draw = 0; audio.bowDraw(); cinematic('charge', {}, 60, true); }
export function releaseFinal() {
  const s = gs(); if (s.scene !== 'final' || !s.drawing) return; s.set({ drawing: false });
  if (s.finalDraw < 0.75) { prompt('Hold longer, then release', true); s.set({ finalDraw: 0 }); sim.satya.draw = 0; stopCinematic(); return; }
  setScene('victory'); prompt(''); s.set({ finalDraw: 1 }); stopCinematic(); flagNow('arrowRelease'); slow(2.4); setShot('arrow');
  const target = bossWorld([0, 6.3, -0.8]);
  fireArrow(target, 'Satyabhama', true, () => victory(target));
  audio.arrow(0); audio.whoosh(0); flash(0.3); kick(16);
}
async function victory(at: Vector3) {
  stat({ time: Math.round(sim.t - battleStart) }); sim.timeScale = 1; sim.slowUntil = 0;
  flash(1); shake(2.2); kick(20); audio.boom(0, true); audio.roar(); audio.chord([146.83, 185, 220, 293.66, 369.99, 440], 0.35, 7);
  for (let k = 0; k < 5; k++) vfx.burst(at.clone().add(_w.set(0, -k * 0.8, 0)), { kind: k === 4 ? 'willow' : 'ring', count: gs().reduceMotion ? 30 : 90, color: FIRE_COLORS[k], speed: 14 + k * 3, life: 2.2, size: 0.3 });
  vfx.shockwave(at, { color: PALETTE.white, radius: 60, duration: 1.6 }); vfx.flash(at, PALETTE.white, 30);
  flagNow('bossDeath'); gs().set({ rage: false }); rage = false; setShot('death');
  cinematic('victory', { text: 'Narakasura falls' }, 3.2);
  const bonus = 2000 + gs().lives * 700; addScore(bonus, at.clone().add(_w.set(0, 2, 0)), `Narakasura falls +${fmt(bonus)}`);
  await wait(3400); hud(null);
  await narrate([
    { who: 'Narrator', text: 'Satyabhama’s arrow found its mark. Narakasura fell, and the night that had covered the land began to lift.' },
    { who: 'Narakasura', text: 'Let my end not be mourned. Let it be remembered with light.' },
    { who: 'Narrator', text: 'The princesses walked free. And across the land, the people lit lamps in every doorway to greet the dawn.', at: () => { setScene('dawn'); flagNow('dawn'); flagNow('lampsOn'); setShot('dawn'); audio.chord([293.66, 369.99, 440, 587.33], 0.25, 8); audio.phrase('dawn'); audio.mood(0); cinematic('dawn', {}, 9); } },
    { who: 'Narrator', text: `That is why we light lamps every year on this night. ${gs().player}, this is Deepavali.` },
  ]);
  finale();
}
function finale() {
  setScene('finale'); flagNow('finale'); setShot('finale'); stopCinematic();
  const show = gs().reduceMotion ? 5 : 14;
  for (let i = 0; i < show; i++) later(200 + i * 520, () => fireworkAt(undefined, i === show - 1));
  later(700, () => { cinematic('finale', { name: gs().player }, 7.4); audio.chord([146.83, 185, 220, 293.66, 369.99], 0.22, 7); audio.phrase('win'); });
  later(8200, closing);
}
export function fireworkAt(p?: Vector3, big = false) {
  const pos = p || new Vector3((Math.random() - 0.5) * 60, 14 + Math.random() * 16, -40 - Math.random() * 30);
  const color = FIRE_COLORS[(Math.random() * FIRE_COLORS.length) | 0];
  vfx.firework(pos, { color, kind: Math.random() < 0.5 ? 'peony' : Math.random() < 0.5 ? 'ring' : 'willow', count: big ? 220 : 140, speed: big ? 16 : 12 }); audio.whoosh(pos.x / 30); later(650, () => audio.boom(pos.x / 30, big));
}
export function rankOf(s: number) { return s >= 24000 ? 3 : s >= 13000 ? 2 : 1; }
export const RANKS = ['', 'Rider of Garuda', 'Keeper of the Lamps', 'Arrow of the Earth'];
function closing() {
  setScene('closing'); const s = gs(); const best = Math.max(s.score, s.best); store.set('arcgx-diwali-best', String(best)); s.set({ best });
  later(900, () => { audio.pluck(146.83, 0.25, -0.2); audio.pluck(220, 0.2, 0.2); audio.pluck(369.99, 0.18, -0.1, 0.05); audio.pluck(587.33, 0.2, 0.1, 0.12); });
}
export function clearAll() {
  timers.forEach(clearTimeout); timers = []; audio.stopBeat();
  const s = gs(); if (s.talk) s.talk.resolve(); if (s.narration) s.narration.resolve();
  s.set({ talk: null, narration: null, cinematic: null, hud: null, prompt: null, drawing: false, finalDraw: 0, rage: false });
  sim.foes.length = 0; sim.maces.length = 0; sim.marks.length = 0; sim.arrows.length = 0; sim.floats.length = 0;
}
export function skip() { clearAll(); const s = gs(); if (!s.flags.bossDeath) { flagNow('bossDeath'); sim.boss.hp = 0; } flagNow('dawn'); flagNow('lampsOn'); sim.dawn = Math.max(sim.dawn, 0.01); sim.garuda.visible = true; sim.garuda.hover = true; finale(); }
export function replay() { clearAll(); later(400, () => start(gs().player)); }

/* ---------------------------------------------------------------- input */
export function tapAt(px: number, py: number) {
  const s = gs();
  if (s.narration) { return; } // narration advances through its own UI
  if (s.scene === 'ride') shootAt(px, py);
  else if (s.scene === 'battle' || s.scene === 'rage') battleShoot(px, py);
  else if (s.scene === 'finale' || s.scene === 'closing') fireworkAt(targeting.unproject(px, py, -50));
}
let lastKey = -9;
export function keyFire() {
  const s = gs(); if (sim.t - lastKey < 0.4) return; lastKey = sim.t;
  if (s.scene === 'ride') { const f = sim.foes.filter((q) => !q.dead).sort((a, b) => b.pos.z - a.pos.z)[0]; if (f) { const p = targeting.project(f.pos); shootAt(p.x, p.y); } }
  else if (s.scene === 'battle' || s.scene === 'rage') { const m = sim.maces.find((q) => !q.dead); if (m) { const p = targeting.project(m.pos); battleShoot(p.x, p.y); return; } const k = sim.marks.find((q) => !q.hit); const p = targeting.project(k ? bossWorld([k.offset.x, k.offset.y, k.offset.z]) : bossWorld([0, 6.2, 0])); battleShoot(p.x, p.y); }
  else if (s.scene === 'finale' || s.scene === 'closing') fireworkAt();
}

/* --------------------------------------------------------- per-frame rules */
/** Called by the simulation each frame after entities move. */
export function tick(dt: number, raw: number) {
  const s = gs(); const scene = s.scene;
  if (scene === 'ride') {
    levelTime += dt; sim.levelTime = levelTime;
    foeT -= dt; if (foeT <= 0) { spawnFoe(); foeT = Math.max(0.42, 1.05 - levelTime * 0.02); }
    if (levelTime > RIDE_LENGTH) endRide();
  }
  if (scene === 'battle' || scene === 'rage') {
    markT -= dt;
    if (markT <= 0 && sim.marks.filter((m) => !m.hit).length < 2) { const sp = MARK_SPOTS[(Math.random() * MARK_SPOTS.length) | 0]; sim.marks.push({ id: sim.nextId++, offset: new Vector3(sp[0], sp[1], sp[2]), r: 1.0, born: sim.t, life: rage ? 2.3 : 2.8, hit: false, hitT: 0 }); markT = rage ? 1.0 : 1.5; }
    maceT -= dt;
    if (maceT <= 0) { sim.boss.swingAt = sim.t; audio.whoosh(0.5); const from = bossWorld(BOSS_HAND); const to = sim.satya.standing ? companionPos('Satyabhama').add(_w.set((Math.random() - 0.5) * 2, -0.5, 0)) : companionPos('Krishna').add(_w.set((Math.random() - 0.5) * 2, -0.6, 0)); sim.maces.push({ id: sim.nextId++, pos: from.clone(), from, to, t: 0, dur: rage ? 1.6 : 2.0, r: 1.2, dead: false }); maceT = rage ? 2.3 : 3.3; }
    stompT -= dt;
    if (stompT <= 0) { sim.boss.stompAt = sim.t; stompT = rage ? 6 : 9; later(450, () => { if (gs().scene === 'battle' || gs().scene === 'rage') { audio.stomp(0); shake(0.7); vfx.shockwave(WORLD.bossPos.clone().add(_w.set(0, 0.2, 0)), { color: PALETTE.coral, radius: 30, duration: 1.2 }); vfx.burst(WORLD.bossPos.clone().add(_w.set(0, 0.5, 0)), { kind: 'dust', count: 40, color: '#7a6a62', speed: 8, life: 2.2, size: 2.5, gravity: -0.3 }); } }); }
  }
  if (scene === 'final' && s.drawing) { const d = Math.min(1, (performance.now() - drawStartedAt) / 1500); if (d !== s.finalDraw) s.set({ finalDraw: d }); sim.satya.draw = d; if (d >= 1 && !s.reduceMotion) shake(0.08); }
  sim.rage += ((s.rage ? 1 : 0) - sim.rage) * Math.min(1, raw * 1.2);
  if (s.flags.dawn) sim.dawn = Math.min(1, (sim.t - s.flags.dawn) / 7);
  if (s.flags.lampsOn) sim.lamps = Math.min(1, (sim.t - s.flags.lampsOn) / 6);
  if (s.flags.bossDeath) sim.boss.dissolve = Math.min(1, (sim.t - s.flags.bossDeath) / 3.2);
}

/* ----------------------------------------------------- debug / automation */
/** Jump straight to a scene with a believable state. Used by the screenshot harness and QA. */
export function jumpTo(scene: Scene, name = 'Suneel') {
  clearAll(); resetSim(); audio.init();
  const s = gs(); s.set({ player: name, score: 8450, lives: 3, bossHp: 100, rage: false, stats: { ...emptyStats(), kills: 14, shots: 20, hits: 16 }, flags: emptyFlags() });
  const f = (k: keyof Flags, t = -5) => s.flag(k, sim.t + t);
  sim.t = 20; sim.garuda.visible = true;
  switch (scene) {
    case 'name': setScene('name'); setShot('intro'); sim.garuda.visible = false; break;
    case 'title': setScene('title'); setShot('title'); sim.speed = 18; sim.garuda.visible = false; cinematic('title', { small: 'ARCGX TECHLABS PRESENTS', big: 'The Night Before the Lights' }, 5.2); break;
    case 'prologue': setScene('prologue'); setShot('prologue'); sim.speed = 6; sim.garuda.visible = false; break;
    case 'mount': setScene('mount'); f('flightIntro', -4); f('mount', -1); setShot('mount'); sim.speed = 10; break;
    case 'ride': ride(); for (let i = 0; i < 6; i++) { spawnFoe(); sim.foes[i].pos.z = -20 - i * 12; } break;
    case 'preboss': setScene('preboss'); f('gatesBreak', -3); f('bossEnter', -2.5); setShot('bossEnter'); sim.garuda.hover = true; sim.boss.roarAt = sim.t - 0.4; break;
    case 'battle': f('gatesBreak', -20); f('bossEnter', -15); battle(); sim.marks.push({ id: 1, offset: new Vector3(...MARK_SPOTS[1]), r: 1, born: sim.t, life: 3, hit: false, hitT: 0 }); sim.maces.push({ id: 2, pos: bossWorld(BOSS_HAND).lerp(new Vector3(0, 1, 0), 0.4), from: bossWorld(BOSS_HAND), to: new Vector3(0, 1.5, -1), t: 0.8, dur: 2, r: 1.2, dead: false }); break;
    case 'fall': f('gatesBreak', -20); f('bossEnter', -15); f('battleStart', -10); setScene('fall'); f('krishnaDown', -0.6); setShot('fall'); sim.garuda.hover = true; sim.krishna.hitAt = sim.t - 0.6; sim.boss.hp = 50; s.set({ bossHp: 50 }); break;
    case 'rage': f('gatesBreak', -20); f('bossEnter', -15); f('battleStart', -10); f('krishnaDown', -6); f('satyaRise', -4); sim.satya.standing = true; sim.garuda.hover = true; rage = true; s.set({ rage: true }); sim.rage = 1; sim.boss.hp = 40; s.set({ bossHp: 40 }); setScene('rage'); setShot('battle'); hud('<b>Chapter 2</b>Narakasura', 'On target <span class="num">16</span>'); break;
    case 'final': f('gatesBreak', -20); f('bossEnter', -15); f('battleStart', -10); f('krishnaDown', -8); f('satyaRise', -6); sim.satya.standing = true; sim.garuda.hover = true; sim.boss.hp = 12; s.set({ bossHp: 12 }); setScene('final'); f('finalStart', -1); setShot('final'); s.set({ drawing: true, finalDraw: 0.9 }); sim.satya.draw = 0.9; prompt('Press and hold to draw the final arrow, then release', true); break;
    case 'victory': f('gatesBreak', -20); f('bossEnter', -15); f('battleStart', -10); f('krishnaDown', -8); f('satyaRise', -6); sim.satya.standing = true; sim.garuda.hover = true; sim.boss.hp = 0; s.set({ bossHp: 0 }); setScene('victory'); f('arrowRelease', -2.4); f('bossDeath', -1.2); sim.boss.dissolve = 0.35; setShot('death'); break;
    case 'dawn': f('krishnaDown', -30); f('satyaRise', -28); sim.satya.standing = true; sim.garuda.hover = true; sim.boss.hp = 0; f('bossDeath', -12); sim.boss.dissolve = 1; setScene('dawn'); f('dawn', -4); f('lampsOn', -4); sim.dawn = 0.6; sim.lamps = 0.7; setShot('dawn'); break;
    case 'finale': f('krishnaDown', -40); f('satyaRise', -38); sim.satya.standing = true; sim.garuda.hover = true; f('bossDeath', -20); sim.boss.dissolve = 1; f('dawn', -12); f('lampsOn', -12); sim.dawn = 1; sim.lamps = 1; setScene('finale'); f('finale', -1); setShot('finale'); cinematic('finale', { name }, 7.4); for (let i = 0; i < 4; i++) later(200 + i * 400, () => fireworkAt()); break;
    case 'closing': f('krishnaDown', -40); f('satyaRise', -38); sim.satya.standing = true; sim.garuda.hover = true; f('bossDeath', -20); sim.boss.dissolve = 1; f('dawn', -12); f('lampsOn', -12); sim.dawn = 1; sim.lamps = 1; setScene('closing'); setShot('finale'); s.set({ best: 9000 }); break;
  }
}
export const director = { start, tapAt, keyFire, beginDraw, releaseFinal, skip, replay, jumpTo, fireworkAt, cinematic, stopCinematic };
