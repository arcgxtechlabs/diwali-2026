/** Companion dialogue box with a live 3D portrait of Krishna or Satyabhama. Driven by store.talk. */
import { useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGameStore } from '@/store/gameStore';
import { Krishna } from '@/characters/Krishna';
import { Satyabhama } from '@/characters/Satyabhama';

export function Guide() {
  const talk = useGameStore((s) => s.talk); const reduce = useGameStore((s) => s.reduceMotion);
  const [i, setI] = useState(0); const [shown, setShown] = useState(''); const typing = useRef<number | null>(null);
  const [who, setWho] = useState<'Krishna' | 'Satyabhama'>('Krishna');
  useEffect(() => { if (talk) { setI(0); setWho(talk.who); } }, [talk]);
  const line = talk?.lines[i] || '';
  useEffect(() => {
    if (!talk) return; if (typing.current) clearInterval(typing.current);
    if (reduce) { setShown(line); return; }
    let n = 0; setShown(''); typing.current = window.setInterval(() => { n += 2; setShown(line.slice(0, n)); if (n >= line.length) { clearInterval(typing.current!); typing.current = null; } }, 20);
    return () => { if (typing.current) clearInterval(typing.current); };
  }, [talk, line, reduce]);
  function advance() {
    const t = useGameStore.getState().talk; if (!t) return;
    if (typing.current) { clearInterval(typing.current); typing.current = null; setShown(t.lines[i]); return; }
    if (i < t.lines.length - 1) { setI(i + 1); return; }
    useGameStore.getState().set({ talk: null }); (document.activeElement as HTMLElement | null)?.blur(); setTimeout(t.resolve, 300);
  }
  useEffect(() => { const onKey = (e: KeyboardEvent) => { if (!useGameStore.getState().talk) return; if ((e.target as HTMLElement).closest('button') && (e.code === 'Space' || e.code === 'Enter')) return; if (e.code === 'Enter' || e.code === 'Space') { e.preventDefault(); advance(); } }; window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey); });
  const last = talk ? i === talk.lines.length - 1 : false;
  return (
    <section id="guide" className={talk ? 'on' : ''} aria-live="polite" aria-label="Your companions">
      <div className="avatar" id="avatar">
        {talk && <Canvas dpr={[1, 2]} camera={{ fov: 28, position: [0, 1.55, 1.9] }} gl={{ antialias: true, alpha: true }} style={{ background: 'transparent' }}>
          <ambientLight intensity={0.6} /><directionalLight position={[2, 3, 2]} intensity={2.4} color="#fff2d8" /><directionalLight position={[-2, 2, -1]} intensity={1.2} color="#0CC1E0" />
          <group position={[0, 0, 0]}>{who === 'Krishna' ? <Krishna mode="portrait" /> : <Satyabhama mode="portrait" />}</group>
        </Canvas>}
      </div>
      <div className="speech" id="speech" onClick={advance}>
        <p className="who">{who}</p>
        <p className="line">{shown}</p>
        <div className="row"><span className="step">{talk ? `${i + 1} of ${talk.lines.length}` : ''}</span><button className="btn" type="button" onClick={(e) => { e.stopPropagation(); advance(); }}>{last ? (talk?.label || 'Continue') : 'Next'}</button></div>
      </div>
    </section>
  );
}
