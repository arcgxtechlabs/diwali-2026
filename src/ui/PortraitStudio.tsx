/**
 * An off-screen studio that renders a hero portrait on demand for the share card.
 * Registers portrait.capture(who) -> data URL. The canvas keeps its drawing buffer so it can be read back.
 */
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import { Krishna } from '@/characters/Krishna';
import { Satyabhama } from '@/characters/Satyabhama';
import { portrait } from './card';

type Who = 'Krishna' | 'Satyabhama';
function Grabber({ onDone }: { onDone: (url: string) => void }) {
  const { gl } = useThree(); const frames = useRef(0);
  useFrame(() => { frames.current += 1; if (frames.current === 36) onDone(gl.domElement.toDataURL('image/png')); });
  return null;
}
export function PortraitStudio() {
  const [who, setWho] = useState<Who | null>(null); const pending = useRef<((url: string | null) => void) | null>(null);
  useEffect(() => {
    portrait.capture = (w) => new Promise((res) => { if (pending.current) pending.current(null); pending.current = res; setWho(w); setTimeout(() => { if (pending.current === res) { res(null); pending.current = null; setWho(null); } }, 6000); });
    return () => { portrait.capture = null; };
  }, []);
  if (!who) return null;
  return (
    <div style={{ position: 'fixed', left: -2000, top: 0, width: 512, height: 512, pointerEvents: 'none', opacity: 0.01 }} aria-hidden="true">
      <Canvas dpr={1} camera={{ fov: 28, position: [0, 1.55, 1.9] }} gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }} style={{ width: 512, height: 512 }}>
        <ambientLight intensity={0.7} /><directionalLight position={[2, 3, 2]} intensity={2.6} color="#fff2d8" /><directionalLight position={[-2, 2, -1]} intensity={1.4} color="#0CC1E0" /><pointLight position={[0, 1.6, 1]} intensity={6} color="#FFC15A" />
        {who === 'Krishna' ? <Krishna mode="portrait" /> : <Satyabhama mode="portrait" />}
        <Grabber onDone={(url) => { const r = pending.current; pending.current = null; setWho(null); r?.(url); }} />
      </Canvas>
    </div>
  );
}
