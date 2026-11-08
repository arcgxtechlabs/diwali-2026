/**
 * PLACEHOLDER Krishna. The character builder replaces this with the full rig.
 * Contract: renders at the parent's origin, feet at y=0, facing -Z, about 1.8 m tall.
 * Game mode reads: gs().scene, gs().flags.krishnaDown, sim.krishna.{draw, shotAt, hitAt, lookAt}, sim.garuda.hover.
 * Showcase states: idle, ride, aim, shoot, hit, fallen, portrait, victory.
 */
import { useFrame } from '@react-three/fiber';
import { useMemo } from 'react';
import { Rig, humanoid, capsule, sphere, mats } from './rig';
import * as clips from './clips';
import type { CharacterProps } from './types';
import { sim } from '@/game/sim';
import { gs } from '@/store/gameStore';

export function Krishna({ mode = 'game', state = 'idle', param = 0 }: CharacterProps) {
  const rig = useMemo(() => {
    const r = new Rig(); const p = humanoid(r, { height: 1.8 });
    const skin = mats.skin('#4A7BD8'), cloth = mats.silk('#F2B33D');
    r.get('pelvis').add(capsule(0.17, 0.3, cloth)); r.get('chest').add(capsule(0.19, 0.4, skin)); r.get('head').add(sphere(0.13, skin));
    for (const s of ['L', 'R']) { r.get('shoulder' + s).add(capsule(0.06, p.armUpper, skin)); r.get('elbow' + s).add(capsule(0.05, p.armLower, skin)); r.get('hip' + s).add(capsule(0.085, p.legUpper, cloth)); r.get('knee' + s).add(capsule(0.065, p.legLower, skin)); }
    r.target(clips.idle(0)); r.snap(); return r;
  }, []);
  useFrame(() => {
    const t = sim.t; let pose = clips.idle(t);
    if (mode === 'game') { const s = gs(); if (s.flags.krishnaDown) pose = clips.fallen(t); else if (s.scene === 'ride' || s.scene === 'battle' || s.scene === 'mount' || s.scene === 'preboss') pose = clips.addPose(clips.ride(t, sim.garuda.hover ? 0.2 : 1), clips.aim(sim.krishna.draw)); }
    else if (mode === 'showcase') { if (state === 'ride') pose = clips.ride(t); else if (state === 'aim') pose = clips.addPose(clips.ride(t, 0.2), clips.aim(param)); else if (state === 'fallen') pose = clips.fallen(t); else if (state === 'victory') pose = clips.victory(t); }
    rig.apply(pose, sim.raw || 0.016);
  });
  return <primitive object={rig.root} />;
}
