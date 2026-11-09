/**
 * Narakasura as an HD-2D pixel sprite, 9.5 m tall (pose table in src/style/cast.ts).
 * Contract: renders at the parent's origin, feet at y=0, facing +Z (toward the camera and Garuda),
 * WORLD.BOSS_HEIGHT tall at scale 1. Hit volumes are in game/world.ts BOSS_HITBOXES.
 * Game mode reads: gs().flags.bossEnter (walk out of the smoke), sim.boss.{hurt, swing, roarAt, stompAt, throwAt, dissolve}.
 * Showcase states: idle, roar, swing (param), throw (param), stomp (param), hurt, death (param = dissolve), portrait.
 */
import { useFrame, useThree } from '@react-three/fiber';
import { useMemo } from 'react';
import { PixelActor } from '@/style/figure';
import { narakasuraAtlas, idleFrame } from '@/style/cast';
import { glow } from '@/style/px';
import type { CharacterProps } from './types';
import { sim } from '@/game/sim';
import { gs } from '@/store/gameStore';

export function Narakasura({ mode = 'game', state = 'idle', param = 0 }: CharacterProps) {
  const actor = useMemo(() => { const a = new PixelActor(narakasuraAtlas(), { shadowR: 2.6, emI: 2.2 }); a.facing = 1; return a; }, []);
  const eyeGlow = useMemo(() => glow('#ff5a3a', 2.4, 0.8), []);
  const { camera } = useThree();
  useFrame(() => {
    const t = sim.t; let frame = idleFrame(t, ['idle0', 'idle1']); let dissolve = 0, hurt = 0;
    if (mode === 'game') {
      const b = sim.boss; dissolve = b.dissolve; hurt = Math.min(1, b.hurt * 4);
      const roar = t - b.roarAt, stomp = t - b.stompAt, thr = t - b.throwAt;
      if (dissolve > 0) frame = dissolve < 0.35 ? 'death0' : 'death1';
      else if (roar >= 0 && roar < 1.6) frame = 'roar';
      else if (b.swing > 0) frame = b.swing > 0.66 ? 'swing0' : b.swing > 0.33 ? 'swing1' : 'swing2';
      else if (thr >= 0 && thr < 0.8) frame = thr < 0.35 ? 'throw0' : 'throw1';
      else if (stomp >= 0 && stomp < 0.9) frame = stomp < 0.45 ? 'stomp0' : 'stomp1';
      else if (b.hurt > 0.12) frame = 'hurt';
      const ent = Math.min(1, (t - (gs().flags.bossEnter || t)) / 2.5); actor.root.position.z = (1 - ent) * -12;
    } else if (mode === 'showcase') {
      if (state === 'roar') frame = 'roar'; else if (state === 'swing') frame = param < 0.33 ? 'swing0' : param < 0.66 ? 'swing1' : 'swing2'; else if (state === 'throw') frame = param < 0.5 ? 'throw0' : 'throw1';
      else if (state === 'stomp') frame = param < 0.5 ? 'stomp0' : 'stomp1'; else if (state === 'hurt') { frame = 'hurt'; hurt = 1; } else if (state === 'death') { dissolve = param; frame = param < 0.35 ? 'death0' : 'death1'; }
    }
    actor.frame(frame); actor.face(camera); actor.dissolve(dissolve); actor.hurt(hurt);
    eyeGlow.position.set(0, 8.3, 0.4); eyeGlow.visible = dissolve < 0.5 && frame !== 'death1'; (eyeGlow.material as { opacity: number }).opacity = 0.6 + 0.4 * Math.sin(t * 6);
    actor.shadow.visible = dissolve < 0.8;
  });
  return (<group><primitive object={actor.root} /><primitive object={eyeGlow} /></group>);
}
