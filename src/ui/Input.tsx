/** Global pointer and keyboard bindings for gameplay. */
import { useEffect } from 'react';
import { director } from '@/game/director';
import { useGameStore } from '@/store/gameStore';

export function Input() {
  useEffect(() => {
    const ui = (t: EventTarget | null) => !!(t as HTMLElement | null)?.closest?.('button, a, input, form, #guide, #hud, #shareBox, .panel, #intro');
    const down = (e: PointerEvent) => { if (ui(e.target)) return; const s = useGameStore.getState(); if (s.narration || s.talk) return; if (s.scene === 'final') { director.beginDraw(); return; } director.tapAt(e.clientX, e.clientY); };
    const up = () => { if (useGameStore.getState().scene === 'final') director.releaseFinal(); };
    const key = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('input')) return; const s = useGameStore.getState();
      if (e.code !== 'Space') return; if (s.narration || s.talk) return; if ((e.target as HTMLElement).closest('button')) return; e.preventDefault();
      if (s.scene === 'final') { if (!e.repeat) director.beginDraw(); return; }
      director.keyFire();
    };
    const keyUp = (e: KeyboardEvent) => { if (e.code === 'Space' && useGameStore.getState().scene === 'final') director.releaseFinal(); };
    window.addEventListener('pointerdown', down); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up); window.addEventListener('keydown', key); window.addEventListener('keyup', keyUp);
    return () => { window.removeEventListener('pointerdown', down); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up); window.removeEventListener('keydown', key); window.removeEventListener('keyup', keyUp); };
  }, []);
  return null;
}
