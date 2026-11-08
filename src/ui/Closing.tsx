import { useEffect, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { director, fmt, rankOf, RANKS } from '@/game/director';
import { LOGO_SVG } from './logo';
import { ShareBox } from './ShareBox';

export function Closing() {
  const scene = useGameStore((s) => s.scene); const score = useGameStore((s) => s.score); const best = useGameStore((s) => s.best); const stats = useGameStore((s) => s.stats); const player = useGameStore((s) => s.player);
  const [on, setOn] = useState(false); const [share, setShare] = useState(false);
  useEffect(() => { if (scene === 'closing') { const id = setTimeout(() => setOn(true), 900); return () => clearTimeout(id); } setOn(false); setShare(false); }, [scene]);
  const r = rankOf(score); const prev = best > score ? best : 0;
  return (<>
    <section id="closing" className={`layer${on ? ' on' : ''}`} aria-label="Your result" aria-hidden={!on}>
      <div className="panel">
        <div className="logo" dangerouslySetInnerHTML={{ __html: LOGO_SVG }} />
        <p className="company">ARCGX TECHLABS</p>
        <p className="tagline">Geospatial Intelligence</p>
        <div className="bigscore"><div className="lbl">{player}’s score</div><div className="val">{fmt(score)}</div><div className="best">{score >= best && best > 0 && score > prev ? (scene === 'closing' ? 'New personal best' : '') : prev ? `Your best: ${fmt(prev)}` : ''}</div></div>
        <div className="rank">{[0, 1, 2].map((i) => <i key={i} className={i < r ? 'on' : ''} />)}<span>{RANKS[r]}</span></div>
        <dl className="stats">
          <div><dt>Asuras struck down</dt><dd>{stats.kills}</dd></div>
          <div><dt>Arrows on target</dt><dd>{stats.shots ? `${Math.round(100 * Math.min(stats.hits, stats.shots) / stats.shots)}%` : '0%'}</dd></div>
          <div><dt>Lamps kept burning</dt><dd>{stats.lives} of 3</dd></div>
          <div><dt>Narakasura fell in</dt><dd>{stats.time ? `${stats.time}s` : 'Skipped'}</dd></div>
        </dl>
        <div className="actions">
          <button className="btn" type="button" onClick={() => setShare(true)}><span className="flame" aria-hidden="true" />Create my Diwali card</button>
          <button className="ghost" type="button" onClick={() => director.replay()}>Play again</button>
        </div>
        <a className="site" href="https://www.arcgx.in" target="_blank" rel="noopener">www.arcgx.in</a>
      </div>
    </section>
    {share && <ShareBox onClose={() => setShare(false)} />}
  </>);
}
