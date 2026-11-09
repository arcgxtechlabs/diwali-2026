import { useEffect } from 'react';
import { World } from '@/scene/World';
import { Showcase } from '@/scene/Showcase';
import { Sheet } from '@/style/Sheet';
import { CinematicOverlay } from '@/cinematics/Overlay';
import { Intro } from '@/ui/Intro';
import { Subtitles } from '@/ui/Subtitles';
import { Guide } from '@/ui/Guide';
import { HUD } from '@/ui/HUD';
import { Closing } from '@/ui/Closing';
import { Input } from '@/ui/Input';
import { PortraitStudio } from '@/ui/PortraitStudio';
import { useGameStore } from '@/store/gameStore';
import { director } from '@/game/director';
import { sim } from '@/game/sim';
import { detectQuality } from '@/utils/quality';
import type { Scene } from '@/game/types';

declare global { interface Window { __diwali?: { director: typeof director; sim: typeof sim; store: typeof useGameStore }; } }

export default function App() {
  const params = new URLSearchParams(location.search); const showcase = params.get('showcase');
  const scene = useGameStore((s) => s.scene); const set = useGameStore((s) => s.set);
  useEffect(() => { set({ quality: detectQuality() }); window.__diwali = { director, sim, store: useGameStore }; const jump = params.get('scene') as Scene | null; if (jump) setTimeout(() => director.jumpTo(jump, params.get('name') || 'Suneel'), 300); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (params.get('sheet')) return <Sheet zoom={Number(params.get('zoom') || 4)} only={params.get('sheet') === '1' ? undefined : params.get('sheet')!} />;
  if (showcase) return <Showcase name={showcase} state={params.get('state') || undefined} param={Number(params.get('param') || 0)} />;
  const bars = ['title', 'prologue', 'mount', 'preboss', 'fall', 'victory', 'dawn'].includes(scene);
  return (<>
    <World />
    <div className="vignette" />
    <div className={`bars${bars ? ' on' : ''}`} />
    <CinematicOverlay />
    <Intro />
    <Subtitles />
    <HUD />
    <Guide />
    <Closing />
    <PortraitStudio />
    <Input />
    <p className="sr">How to play. During the ride, tap the asuras and fireballs that fly towards you. During the battle, tap Narakasura, and tap his glowing marks for more damage. Tap the fire maces he throws to break them. For the final arrow, press and hold anywhere, then release. The space bar fires at the nearest target, holding it draws the final arrow, and Enter continues the story.</p>
  </>);
}
