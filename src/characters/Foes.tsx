/**
 * Enemies as HD-2D pixel sprites: asuras on ember wings (a three-frame wing beat, glowing eyes,
 * dissolve on death) and fireballs (the pixel flame atlas with a halo). Renders sim.foes each frame
 * from a pool of 40; dead foes linger 0.8 s (f.dying) while they dissolve.
 */
import { useFrame, useThree } from '@react-three/fiber';
import { useMemo } from 'react';
import { Group } from 'three';
import { PixelActor } from '@/style/figure';
import { asuraAtlas, cycle } from '@/style/cast';
import { fire, glow, flick } from '@/style/px';
import { sim } from '@/game/sim';

const MAX = 24;
export function Foes() {
  const asuras = useMemo(() => Array.from({ length: MAX }, () => { const a = new PixelActor(asuraAtlas(), { shadowR: 0.5, emI: 2 }); a.facing = 1; a.shadow.visible = false; a.root.visible = false; return a; }), []);
  const fires = useMemo(() => Array.from({ length: MAX }, (_, i) => { const g = new Group(); const f = fire(2.6, { seed: i * 7, i: 3 }); f.position.y = -1.3; g.add(f); const h = glow('#ff8c3a', 4, 1.1); g.add(h); g.visible = false; return { g, f, h }; }), []);
  const { camera } = useThree();
  useFrame(() => {
    let a = 0, f = 0; const t = sim.t;
    for (const foe of sim.foes) {
      const dying = foe.dead ? Math.min(1, (t - foe.dying) / 0.6) : 0;
      if (foe.kind === 'asura') { if (a >= MAX) continue; const A = asuras[a++]; A.root.visible = true; A.root.position.copy(foe.pos); A.root.position.y -= 0.9 * foe.r / 1.6; A.root.scale.setScalar(foe.r / 1.6); A.frame(`fly${cycle(t + foe.phase, 9, 3)}`); A.face(camera); A.dissolve(dying); A.hurt(dying > 0 ? 1 - dying : 0); }
      else { if (f >= MAX) continue; const F = fires[f++]; F.g.visible = true; F.g.position.copy(foe.pos); const k = (1 - dying) * foe.r / 1.1 * flick(t, foe.phase); F.f.userData.update?.(t + foe.phase, { x: camera.position.x, z: camera.position.z }, k); F.h.scale.setScalar(4 * k); }
    }
    for (let i = a; i < MAX; i++) asuras[i].root.visible = false; for (let i = f; i < MAX; i++) fires[i].g.visible = false;
  });
  return (<group>{asuras.map((A, i) => <primitive key={'a' + i} object={A.root} />)}{fires.map((F, i) => <primitive key={'f' + i} object={F.g} />)}</group>);
}
