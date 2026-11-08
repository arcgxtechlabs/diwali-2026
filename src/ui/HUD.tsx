import { useEffect, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { director, fmt } from '@/game/director';
import { audio } from '@/audio/engine';
import { sim } from '@/game/sim';

export function HUD() {
  const hud = useGameStore((s) => s.hud); const lives = useGameStore((s) => s.lives); const score = useGameStore((s) => s.score);
  const bossHp = useGameStore((s) => s.bossHp); const scene = useGameStore((s) => s.scene); const rage = useGameStore((s) => s.rage);
  const prompt = useGameStore((s) => s.prompt); const toast = useGameStore((s) => s.toast);
  const [muted, setMuted] = useState(false);
  const bossOn = scene === 'battle' || scene === 'rage' || scene === 'final';
  return (<>
    <div id="hud" className={hud ? 'on' : ''} aria-live="polite">
      <span className="chip" dangerouslySetInnerHTML={{ __html: hud?.level || '' }} />
      <span className="chip" dangerouslySetInnerHTML={{ __html: hud?.stat || '' }} />
      <span className="chip lives"><b>Lamps</b>{[0, 1, 2].map((i) => <i key={i} className={i < lives ? 'on' : ''} />)}</span>
      <span className="chip"><b>Score</b><span className="num">{fmt(score)}</span></span>
      <button className="ghost chip" id="skip" type="button" onClick={() => director.skip()}>Skip to the ending</button>
    </div>
    <div id="boss" className={`${bossOn ? 'on' : ''}${rage ? ' rage' : ''}`} aria-live="polite"><p>Narakasura</p><div className="track"><div className="fill" style={{ width: `${bossHp}%` }} /></div></div>
    <div id="prompt" className={`${prompt ? 'on' : ''}${prompt?.hot ? ' hot' : ''}`} aria-live="polite">{prompt?.text || ''}</div>
    <button id="sound" className={scene === 'name' ? '' : 'on'} type="button" aria-label={muted ? 'Turn sound on' : 'Mute sound'} aria-pressed={muted} onClick={() => setMuted(audio.toggle())}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5Z" /><path style={{ opacity: muted ? 0 : 1 }} d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" /></svg>
    </button>
    <div id="toast" className={toast ? 'on' : ''} role="status">{toast}</div>
    <Flash />
  </>);
}
function Flash() {
  const [o, setO] = useState(0);
  useEffect(() => { let id = 0; const loop = () => { id = requestAnimationFrame(loop); setO((v) => (Math.abs(v - sim.flash) > 0.01 ? sim.flash : v)); }; id = requestAnimationFrame(loop); return () => cancelAnimationFrame(id); }, []);
  return <div className="flash" style={{ opacity: o }} />;
}
