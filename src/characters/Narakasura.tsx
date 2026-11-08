/**
 * PLACEHOLDER Narakasura. The character builder replaces this with the full rig.
 * Contract: renders at the parent's origin, feet at y=0, facing +Z (toward the camera and Garuda),
 * WORLD.BOSS_HEIGHT (9.5 m) tall at scale 1. Hit volumes are in game/world.ts BOSS_HITBOXES.
 * Game mode reads: gs().flags.bossEnter (walk out of the smoke), sim.boss.{hurt, swingAt, roarAt, stompAt, throwAt, dissolve, hp}.
 * Showcase states: idle, roar, swing (param), throw (param), stomp (param), hurt, death (param = dissolve), portrait.
 */
import { useFrame } from '@react-three/fiber';
import { useMemo } from 'react';
import { Rig, humanoid, capsule, sphere, mats, DEG } from './rig';
import * as clips from './clips';
import type { CharacterProps } from './types';
import { sim } from '@/game/sim';
import { WORLD } from '@/game/world';

export function Narakasura({ mode = 'game', state = 'idle', param = 0 }: CharacterProps) {
  const rig = useMemo(() => {
    const r = new Rig(); const p = humanoid(r, { height: WORLD.BOSS_HEIGHT, shoulder: 0.26, hip: 0.12 });
    const skin = mats.skin('#2a1a22'), eye = mats.emissive('#FF8071', 3);
    r.get('pelvis').add(capsule(0.17 * 5.3, 0.3 * 5.3, skin)); r.get('chest').add(capsule(0.2 * 5.3, 0.42 * 5.3, skin)); const head = sphere(0.14 * 5.3, skin); r.get('head').add(head);
    const eL = sphere(0.12, eye); eL.position.set(0.25, 0.1, 0.65); head.add(eL); const eR = sphere(0.12, eye); eR.position.set(-0.25, 0.1, 0.65); head.add(eR);
    for (const s of ['L', 'R']) { r.get('shoulder' + s).add(capsule(0.07 * 5.3, p.armUpper, skin)); r.get('elbow' + s).add(capsule(0.06 * 5.3, p.armLower, skin)); r.get('hip' + s).add(capsule(0.09 * 5.3, p.legUpper, skin)); r.get('knee' + s).add(capsule(0.07 * 5.3, p.legLower, skin)); }
    r.root.rotation.y = Math.PI; r.target(clips.idle(0)); r.snap(); return r;
  }, []);
  useFrame(() => {
    const t = sim.t; let pose = clips.idle(t, 2);
    const roar = mode === 'game' ? Math.min(1, Math.max(0, (t - sim.boss.roarAt) / 1.6)) : state === 'roar' ? 0.5 : 1;
    if (roar < 1) pose = clips.addPose(pose, { chest: [-0.35, 0, 0], head: [-0.5, 0, 0], shoulderL: [-1.2, 0, -1.2], shoulderR: [-1.2, 0, 1.2] }, Math.sin(roar * Math.PI));
    const swing = mode === 'game' ? sim.boss.swing : state === 'swing' ? param : 0;
    if (swing > 0) pose = clips.addPose(pose, { shoulderR: [-2.2 + swing * 2.5, 0, 0.8], elbowR: [0, 0, 0.6], chest: [0.3 * (1 - swing), 0.3, 0] }, 1);
    const dissolve = mode === 'game' ? sim.boss.dissolve : state === 'death' ? param : 0;
    if (dissolve > 0) pose = clips.addPose(pose, { pelvis: { rot: [0.9, 0, 0], pos: [0, -2.5 * 5.3 * 0.1, 0] }, hipL: [-1.5, 0, 0], hipR: [-1.5, 0, 0], kneeL: [2, 0, 0], kneeR: [2, 0, 0], head: [0.6, 0, 0] }, Math.min(1, dissolve * 2));
    rig.apply(pose, sim.raw || 0.016);
    rig.root.visible = dissolve < 1;
    if (mode === 'game') { const ent = Math.min(1, (t - (gsFlags().bossEnter || t)) / 2.5); rig.root.position.z = (1 - ent) * -12; }
  });
  return <primitive object={rig.root} />;
}
import { gs } from '@/store/gameStore';
const gsFlags = () => gs().flags;
export const _unusedDEG = DEG;
