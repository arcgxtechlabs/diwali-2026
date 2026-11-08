/**
 * PLACEHOLDER Satyabhama. The character builder replaces this with the full rig.
 * Contract: renders at the parent's origin, feet at y=0, facing -Z, about 1.7 m tall.
 * Game mode reads: gs().scene, gs().flags.satyaRise, sim.satya.{draw, shotAt, standing, lookAt}, gs().finalDraw.
 * Showcase states: idle, ride, rise, stand, aim, draw (param = draw), shoot, victory, portrait.
 */
import { useFrame } from '@react-three/fiber';
import { useMemo } from 'react';
import { Rig, humanoid, capsule, sphere, mats } from './rig';
import * as clips from './clips';
import type { CharacterProps } from './types';
import { sim } from '@/game/sim';
import { gs } from '@/store/gameStore';

export function Satyabhama({ mode = 'game', state = 'idle', param = 0 }: CharacterProps) {
  const rig = useMemo(() => {
    const r = new Rig(); const p = humanoid(r, { height: 1.7, shoulder: 0.19 });
    const skin = mats.skin('#B9774F'), cloth = mats.silk('#C2423A');
    r.get('pelvis').add(capsule(0.16, 0.3, cloth)); r.get('chest').add(capsule(0.17, 0.38, cloth)); r.get('head').add(sphere(0.12, skin));
    for (const s of ['L', 'R']) { r.get('shoulder' + s).add(capsule(0.05, p.armUpper, skin)); r.get('elbow' + s).add(capsule(0.045, p.armLower, skin)); r.get('hip' + s).add(capsule(0.08, p.legUpper, cloth)); r.get('knee' + s).add(capsule(0.06, p.legLower, cloth)); }
    r.target(clips.idle(0)); r.snap(); return r;
  }, []);
  useFrame(() => {
    const t = sim.t; let pose = clips.idle(t);
    if (mode === 'game') {
      const s = gs();
      if (s.flags.satyaRise) { const k = Math.min(1, (t - s.flags.satyaRise) / 1.6); pose = k < 1 ? clips.rise(k) : clips.addPose(clips.heroStand(t), clips.aim(s.scene === 'final' || s.scene === 'victory' ? s.finalDraw : sim.satya.draw)); }
      else if (['mount', 'ride', 'preboss', 'battle', 'fall'].includes(s.scene)) pose = clips.ride(t, sim.garuda.hover ? 0.2 : 1);
    } else if (mode === 'showcase') { if (state === 'ride') pose = clips.ride(t); else if (state === 'rise') pose = clips.rise(param); else if (state === 'aim' || state === 'draw') pose = clips.addPose(clips.heroStand(t), clips.aim(param)); else if (state === 'victory') pose = clips.victory(t); }
    rig.apply(pose, sim.raw || 0.016);
  });
  return <primitive object={rig.root} />;
}
