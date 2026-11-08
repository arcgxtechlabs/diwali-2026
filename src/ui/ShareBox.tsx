import { useEffect, useRef, useState } from 'react';
import { makeCard, fileName, shareText } from './card';
import { useGameStore } from '@/store/gameStore';

export function ShareBox({ onClose }: { onClose: () => void }) {
  const [url, setUrl] = useState<string>(''); const blob = useRef<Blob | null>(null); const [canShare, setCanShare] = useState(false); const set = useGameStore((s) => s.set);
  const toast = (t: string) => { set({ toast: t }); setTimeout(() => { if (useGameStore.getState().toast === t) set({ toast: '' }); }, 2400); };
  useEffect(() => { let u = ''; (async () => { const b = await makeCard(); if (!b) { toast('The card could not be created. Try again.'); onClose(); return; } blob.current = b; u = URL.createObjectURL(b); setUrl(u); const file = new File([b], fileName(), { type: 'image/png' }); setCanShare(!!(navigator.canShare && navigator.canShare({ files: [file] }))); })(); return () => { if (u) URL.revokeObjectURL(u); }; // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { const onKey = (e: KeyboardEvent) => { if (e.code === 'Escape') onClose(); }; window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey); }, [onClose]);
  const share = async () => { if (!blob.current) return; const file = new File([blob.current], fileName(), { type: 'image/png' }); try { await navigator.share({ files: [file], title: 'Happy Diwali', text: shareText() }); } catch (e) { if ((e as Error).name !== 'AbortError') toast('Sharing is not available here. Use Save card instead.'); } };
  const save = () => { if (!url) return; const a = document.createElement('a'); a.href = url; a.download = fileName(); document.body.appendChild(a); a.click(); a.remove(); toast('Card saved'); };
  return (
    <div id="shareBox" className={url ? 'on' : ''} role="dialog" aria-modal="true" aria-labelledby="shareTitle">
      <div className="sharewrap">
        <h3 id="shareTitle">Your Diwali card is ready</h3>
        {url && <img src={url} alt="Your Diwali card from ArcGX TechLabs with your name, wish and score" />}
        <div className="actions">{canShare && <button className="btn" type="button" onClick={share}><span className="flame" aria-hidden="true" />Share card</button>}<button className={canShare ? 'ghost' : 'btn'} type="button" onClick={save}>Save card</button><button className="ghost" type="button" onClick={onClose}>Close</button></div>
        <p className="tip">On a phone, you can also press and hold the card to save it.</p>
      </div>
    </div>
  );
}
