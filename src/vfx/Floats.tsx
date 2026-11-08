/** Floating score labels: DOM elements projected from sim.floats. */
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { Html } from '@react-three/drei';
import { sim } from '@/game/sim';
import { targeting } from '@/game/targeting';

export function Floats() {
  const ref = useRef<HTMLDivElement>(null!);
  useFrame(() => {
    const el = ref.current; if (!el) return;
    let html = '';
    for (const f of sim.floats) { const p = targeting.project(f.pos); if (p.z > 1) continue; const a = 1 - Math.pow(f.t / 1.2, 2); html += `<span style="left:${p.x}px;top:${p.y - f.t * 60}px;opacity:${a};color:${f.color}">${f.text}</span>`; }
    if (el.innerHTML !== html) el.innerHTML = html;
  });
  return <Html fullscreen zIndexRange={[5, 5]} style={{ pointerEvents: 'none' }}><div ref={ref} className="floats" /></Html>;
}
