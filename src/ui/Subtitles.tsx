/** Cinematic narration: typed subtitles, tap or Enter to advance. Driven by store.narration. */
import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/store/gameStore';

export function Subtitles() {
  const narration = useGameStore((s) => s.narration); const reduce = useGameStore((s) => s.reduceMotion);
  const [i, setI] = useState(0); const [shown, setShown] = useState(''); const done = useRef(false); const timer = useRef<number | null>(null); const auto = useRef<number | null>(null);
  const line = narration?.lines[i];
  useEffect(() => { setI(0); }, [narration]);
  useEffect(() => {
    if (!line) return; done.current = false; line.at?.();
    if (timer.current) clearInterval(timer.current); if (auto.current) clearTimeout(auto.current);
    if (reduce) { setShown(line.text); done.current = true; auto.current = window.setTimeout(next, 1200 + line.text.length * 40); return; }
    let n = 0; setShown('');
    timer.current = window.setInterval(() => { n += 1; setShown(line.text.slice(0, n)); if (n >= line.text.length) { clearInterval(timer.current!); timer.current = null; done.current = true; auto.current = window.setTimeout(next, 900 + line.text.length * 28); } }, 26);
    return () => { if (timer.current) clearInterval(timer.current); if (auto.current) clearTimeout(auto.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [line]);
  function next() {
    const n = useGameStore.getState().narration; if (!n) return;
    if (!done.current) { if (timer.current) clearInterval(timer.current); timer.current = null; setShown(n.lines[i].text); done.current = true; if (auto.current) clearTimeout(auto.current); auto.current = window.setTimeout(next, 700 + n.lines[i].text.length * 20); return; }
    if (auto.current) clearTimeout(auto.current);
    if (i < n.lines.length - 1) { setI(i + 1); return; }
    useGameStore.getState().set({ narration: null }); setTimeout(n.resolve, 250);
  }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (!useGameStore.getState().narration) return; if ((e.target as HTMLElement).closest('input, button')) return; if (e.code === 'Enter' || e.code === 'Space') { e.preventDefault(); next(); } };
    const onTap = (e: PointerEvent) => { if (!useGameStore.getState().narration) return; if ((e.target as HTMLElement).closest('button, a, input, #guide, #hud, #shareBox, .panel')) return; next(); };
    window.addEventListener('keydown', onKey); window.addEventListener('pointerdown', onTap); return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('pointerdown', onTap); };
  });
  return (<div id="sub" className={narration ? 'on' : ''} aria-live="polite"><p className="spk">{line?.who || ''}</p><p className="txt">{shown}</p><p className="tap">Tap to continue</p></div>);
}
