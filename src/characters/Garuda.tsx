/**
 * Garuda as an HD-2D pixel sprite: a 9 m wingspan stepping through a four-frame wing cycle
 * (8 fps in flight, 5 fps hovering), seen from behind or the front depending on the camera.
 * Contract: renders at the parent's origin (the parent is at sim.garuda.pos, rotated by bank/pitch).
 * Body centre near y=0, riders sit at WORLD.krishnaSeat / satyaSeat (back at about y=0.45). Faces -Z.
 * The three lamps on his tail are the player's lives: real pixel diyas that go out one by one.
 * Showcase states: fly, hover, glide.
 */
import { useFrame, useThree } from '@react-three/fiber';
import { useMemo } from 'react';
import { Mesh, MeshBasicMaterial, PlaneGeometry, DoubleSide, Texture } from 'three';
import { PixelActor } from '@/style/figure';
import { garudaAtlas, GARUDA_FRAMES, cycle } from '@/style/cast';
import { diyaAtlas, DIYA_SIZE } from '@/style/set';
import { sim } from '@/game/sim';
import { gs } from '@/store/gameStore';
import type { CharacterProps } from './types';

const LAMP_POS: [number, number, number][] = [[-0.42, 0.42, 1.55], [0.42, 0.42, 1.55], [0, 0.5, 1.95]];
export function Garuda({ mode = 'game', state = 'fly' }: CharacterProps) {
  const actor = useMemo(() => { const a = new PixelActor(garudaAtlas(), { castShadow: true }); a.facing = -1; a.shadow.visible = false; return a; }, []);
  const lamps = useMemo(() => { const A = diyaAtlas(); return LAMP_POS.map(() => { const t = A.tex.clone() as Texture; t.needsUpdate = true; t.repeat.set(1 / A.n, 1); const g = new PlaneGeometry(DIYA_SIZE.w * 0.5, DIYA_SIZE.h * 0.5); g.translate(0, DIYA_SIZE.h * 0.25, 0); const m = new Mesh(g, new MeshBasicMaterial({ map: t, alphaTest: 0.4, side: DoubleSide, color: '#ffffff' })); m.renderOrder = 4; return m; }); }, []);
  const { camera } = useThree();
  useFrame(() => {
    const t = sim.t; const back = actor.seesBack(camera);
    const flap = mode === 'game' ? sim.garuda.flap : state === 'glide' ? 0 : 1; const hover = mode === 'game' ? sim.garuda.hover : state === 'hover';
    let frame: string;
    if (flap < 0.3) frame = back ? GARUDA_FRAMES.glide : GARUDA_FRAMES.glideF; else { const i = cycle(t, hover ? 5 : 8); frame = (back ? GARUDA_FRAMES.back : GARUDA_FRAMES.front)[i]; }
    actor.frame(frame); actor.face(camera);
    actor.mesh.position.set(0, -1.2, back ? -0.6 : 0.6);
    const lives = mode === 'game' ? gs().lives : 3; const A = diyaAtlas();
    lamps.forEach((m, i) => { m.position.set(...LAMP_POS[i]); m.rotation.y = actor.root.rotation.y; const lit = i < lives; (m.material as MeshBasicMaterial).map!.offset.x = (lit ? 1 + (Math.floor(t * 8 + i * 1.7) % 3) : 0) / A.n; (m.material as MeshBasicMaterial).color.setScalar(lit ? 1.15 : 0.7); });
  });
  return (<group><primitive object={actor.root} />{lamps.map((m, i) => <primitive key={i} object={m} />)}</group>);
}
