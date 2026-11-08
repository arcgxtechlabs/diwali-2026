import { useState, type FormEvent } from 'react';
import { useGameStore } from '@/store/gameStore';
import { director } from '@/game/director';
import type { QualityTier } from '@/game/types';

const TIERS: QualityTier[] = ['low', 'medium', 'high', 'ultra'];
export function Intro() {
  const scene = useGameStore((s) => s.scene); const saved = useGameStore((s) => s.player); const quality = useGameStore((s) => s.quality); const set = useGameStore((s) => s.set);
  const [name, setName] = useState(saved); const [err, setErr] = useState('');
  const submit = (e: FormEvent) => { e.preventDefault(); const v = name.replace(/\s+/g, ' ').trim(); if (!v) { setErr('Enter your name to begin.'); return; } setErr(''); (document.activeElement as HTMLElement | null)?.blur(); director.start(v.slice(0, 22)); };
  return (
    <section id="intro" className={`layer${scene === 'name' ? '' : ' gone'}`} aria-labelledby="introTitle" aria-hidden={scene !== 'name'}>
      <form id="nameForm" autoComplete="off" noValidate onSubmit={submit}>
        <p className="company">ARCGX TECHLABS</p>
        <h1 id="introTitle" className="title">The Night Before the Lights</h1>
        <p className="lede">The story of Narakasura, told as a game. Ride with Krishna and Satyabhama, bring the demon king down, and end the night with a Diwali card in your name.</p>
        <div className="namebox">
          <label htmlFor="name">What is your name?</label>
          <input id="name" name="name" type="text" maxLength={22} placeholder="Your name" enterKeyHint="go" spellCheck={false} value={name} onChange={(e) => setName(e.target.value)} disabled={scene !== 'name'} />
          <button className="btn" type="submit" disabled={scene !== 'name'}><span className="flame" aria-hidden="true" />Begin the story</button>
          <p className="err" id="err" role="alert">{err}</p>
        </div>
        <p className="meta">Sound on. About three minutes.</p>
        <div className="quality" role="group" aria-label="Graphics quality">{TIERS.map((t) => <button key={t} type="button" className={t === quality ? 'on' : ''} onClick={() => set({ quality: t })}>{t[0].toUpperCase() + t.slice(1)}</button>)}</div>
      </form>
    </section>
  );
}
