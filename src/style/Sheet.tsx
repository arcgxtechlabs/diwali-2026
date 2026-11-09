/**
 * Sprite sheet review page: `?sheet=1` shows every atlas at 4x without WebGL,
 * so drawings can be checked against docs/VISUAL-STYLE.md quickly.
 */
import { useEffect, useRef } from 'react';
import { krishnaAtlas, satyabhamaAtlas, narakasuraAtlas, asuraAtlas, garudaAtlas } from './cast';
import { fireAtlas } from './px';
import { diyaAtlas } from './set';

export function Sheet({ zoom = 4, only }: { zoom?: number; only?: string }) {
  const ref = useRef<HTMLDivElement>(null!);
  useEffect(() => {
    const el = ref.current; el.innerHTML = '';
    const items: [string, HTMLCanvasElement, number][] = [
      ['krishna', krishnaAtlas().canvas, zoom], ['satyabhama', satyabhamaAtlas().canvas, zoom], ['asura', asuraAtlas().canvas, zoom], ['fire', fireAtlas().canvas, zoom * 2], ['diya', diyaAtlas().canvas, zoom * 2],
      ['garuda', garudaAtlas().canvas, only ? zoom : Math.max(1, zoom / 2)], ['narakasura', narakasuraAtlas().canvas, only ? zoom : Math.max(1, zoom / 3)],
    ];
    for (const [name, c, z] of items) {
      if (only && name !== only) continue;
      const h = document.createElement('h3'); h.textContent = `${name} · ${c.width}×${c.height}`; el.appendChild(h);
      const img = document.createElement('img'); img.src = c.toDataURL(); img.style.width = `${c.width * z}px`; img.style.imageRendering = 'pixelated'; img.style.display = 'block'; img.style.background = '#2a3a55'; el.appendChild(img);
    }
  }, [zoom, only]);
  return <div ref={ref} style={{ position: 'fixed', inset: 0, overflow: 'auto', padding: 16, background: '#16223a', color: '#d8c28e', font: '14px Cormorant Garamond, serif' }} />;
}
