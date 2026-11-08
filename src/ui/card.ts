/**
 * Share card: a 1080x1350 PNG with the player's name, wish, score, rank, a portrait of
 * Krishna or Satyabhama (captured from the live 3D scene when available) and the ArcGX lockup.
 */
import { gs } from '@/store/gameStore';
import { rankOf, RANKS, fmt } from '@/game/director';
import { LOGO_SVG } from './logo';
import { PALETTE as C } from '@/vfx/bus';

function svgImage(svg: string): Promise<HTMLImageElement> { return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg.includes('xmlns=') ? svg : svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"')); }); }
function wrapText(g: CanvasRenderingContext2D, text: string, maxW: number) { const words = text.split(' '), lines: string[] = []; let cur = ''; words.forEach((w) => { const t = cur ? cur + ' ' + w : w; if (g.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }); if (cur) lines.push(cur); return lines; }
function fitFont(g: CanvasRenderingContext2D, text: string, weight: number, family: string, size: number, maxW: number) { let s = size; do { g.font = `${weight} ${s}px ${family}`; s -= 2; } while (g.measureText(text).width > maxW && s > 20); }
function rrect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function diya(g: CanvasRenderingContext2D, x: number, y: number, s: number, seed: number) {
  g.save(); g.translate(x, y); g.scale(s, s);
  const gr = g.createRadialGradient(0, -18, 0, 0, -18, 80); gr.addColorStop(0, 'rgba(255,193,90,0.85)'); gr.addColorStop(0.35, 'rgba(255,193,90,0.25)'); gr.addColorStop(1, 'rgba(255,193,90,0)'); g.fillStyle = gr; g.beginPath(); g.arc(0, -18, 80, 0, 7); g.fill();
  g.save(); g.translate(0, -6); g.rotate(0.07 * Math.sin(seed * 2)); g.scale(1.3, 1.3); const fg = g.createLinearGradient(0, -1, 0, -40); fg.addColorStop(0, '#FFE9B0'); fg.addColorStop(0.45, C.flame); fg.addColorStop(1, C.coral); g.fillStyle = fg; g.beginPath(); g.moveTo(0, -40); g.bezierCurveTo(10, -26, 12, -12, 0, -1); g.bezierCurveTo(-12, -12, -10, -26, 0, -40); g.fill(); g.globalAlpha = 0.9; g.fillStyle = C.white; g.beginPath(); g.moveTo(0, -24); g.bezierCurveTo(4, -17, 5, -10, 0, -5); g.bezierCurveTo(-5, -10, -4, -17, 0, -24); g.fill(); g.restore();
  g.globalAlpha = 1; g.fillStyle = C.coral; g.beginPath(); g.moveTo(-34, -4); g.quadraticCurveTo(-31, 22, 0, 24); g.quadraticCurveTo(31, 22, 34, -4); g.closePath(); g.fill();
  g.fillStyle = '#E86E61'; g.beginPath(); g.ellipse(0, -4, 34, 7, 0, 0, 7); g.fill(); g.globalAlpha = 0.85; g.fillStyle = '#5A2018'; g.beginPath(); g.ellipse(0, -4, 27, 4.4, 0, 0, 7); g.fill(); g.restore();
}
/** Optional portrait provider registered by the scene (returns a data URL of the hero). */
export const portrait: { capture: ((who: 'Krishna' | 'Satyabhama') => Promise<string | null>) | null } = { capture: null };

export async function makeCard(): Promise<Blob | null> {
  try { await document.fonts.ready; } catch { /* fonts optional */ }
  const { player, score, stats } = gs();
  const CW = 1080, CH = 1350, c = document.createElement('canvas'); c.width = CW; c.height = CH; const g = c.getContext('2d')!;
  const OUT = "'Outfit', 'Segoe UI', sans-serif", INT = "'Inter', 'Segoe UI', sans-serif", CIN = "'Cinzel', 'Outfit', serif";
  const bg = g.createRadialGradient(CW / 2, 520, 0, CW / 2, 520, 900); bg.addColorStop(0, C.navy2); bg.addColorStop(1, C.navy); g.fillStyle = bg; g.fillRect(0, 0, CW, CH);
  g.strokeStyle = C.cyan; g.lineWidth = 1.5; for (let i = 0; i < 12; i++) { const r = 60 + i * 110; g.globalAlpha = 0.12 * Math.max(0.2, 1 - r / 1400); g.beginPath(); g.arc(CW / 2, 520, r, 0, 7); g.stroke(); }
  for (let i = 0; i < 90; i++) { g.globalAlpha = 0.2 + Math.random() * 0.4; g.fillStyle = Math.random() < 0.3 ? C.light : C.flame; g.beginPath(); g.arc(Math.random() * CW, Math.random() * CH, 1 + Math.random() * 2.2, 0, 7); g.fill(); }
  ([[150, 170, C.light], [930, 150, C.coral], [880, 330, C.flame]] as [number, number, string][]).forEach(([x, y, col]) => { for (let i = 0; i < 36; i++) { const a = i / 36 * 6.283; g.globalAlpha = 0.7; g.strokeStyle = i % 4 ? col : C.white; g.lineWidth = 2.4; g.beginPath(); g.moveTo(x + Math.cos(a) * 30, y + Math.sin(a) * 30); g.lineTo(x + Math.cos(a) * (70 + (i % 3) * 10), y + Math.sin(a) * (70 + (i % 3) * 10)); g.stroke(); } });
  g.globalAlpha = 1; for (let i = 0; i < 5; i++) diya(g, CW / 2 + (i - 2) * 110, 140, 0.75, i);
  g.textAlign = 'center'; g.fillStyle = C.white; g.font = `900 132px ${CIN}`; g.shadowColor = 'rgba(255,193,90,0.45)'; g.shadowBlur = 40; g.fillText('Happy Diwali', CW / 2, 360); g.shadowBlur = 0;
  fitFont(g, `from ${player}`, 600, OUT, 66, 900); g.fillStyle = C.flame; g.fillText(`from ${player}`, CW / 2, 450);
  g.font = `500 34px ${INT}`; g.fillStyle = C.light; wrapText(g, 'May the festival of lights fill your home with joy, your work with clarity and your year with prosperity.', 860).forEach((l, i) => g.fillText(l, CW / 2, 528 + i * 48));
  const px = 90, py = 690, pw = CW - 180, ph = 270;
  g.fillStyle = 'rgba(167,240,255,0.07)'; rrect(g, px, py, pw, ph, 32); g.fill(); g.strokeStyle = 'rgba(167,240,255,0.25)'; g.lineWidth = 2; g.stroke();
  const r = rankOf(score); const hero: 'Krishna' | 'Satyabhama' = r === 3 ? 'Satyabhama' : 'Krishna';
  let av: HTMLImageElement | null = null;
  try { const url = portrait.capture ? await portrait.capture(hero) : null; if (url) av = await new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; }); } catch { av = null; }
  g.save(); g.beginPath(); g.arc(px + 105, py + 110, 72, 0, 7); g.closePath(); g.fillStyle = '#13384a'; g.fill(); g.clip(); if (av) g.drawImage(av, px + 33, py + 38, 144, 144); else { g.fillStyle = hero === 'Krishna' ? '#4A7BD8' : '#B9774F'; g.beginPath(); g.arc(px + 105, py + 100, 36, 0, 7); g.fill(); } g.restore(); g.strokeStyle = 'rgba(255,193,90,0.7)'; g.lineWidth = 3; g.beginPath(); g.arc(px + 105, py + 110, 72, 0, 7); g.stroke();
  g.textAlign = 'center'; g.fillStyle = C.flame; g.font = `600 22px ${OUT}`; g.fillText(RANKS[r], px + 105, py + 222);
  for (let i = 0; i < 3; i++) { g.fillStyle = i < r ? C.flame : 'rgba(167,240,255,0.25)'; g.beginPath(); g.ellipse(px + 80 + i * 25, py + 248, 7, 10, 0, 0, 7); g.fill(); }
  g.textAlign = 'left'; g.fillStyle = C.light; g.font = `500 24px ${INT}`; g.fillText(`${player.length > 18 ? player.slice(0, 17) + '…' : player}’s score`, px + 230, py + 62);
  g.fillStyle = C.flame; g.font = `700 92px ${OUT}`; g.fillText(fmt(score), px + 226, py + 150);
  g.font = `500 23px ${INT}`; g.fillStyle = C.white;
  g.fillText(`${stats.kills} asuras struck down    ${stats.lives} of 3 lamps kept burning`, px + 230, py + 200);
  g.fillText(stats.time ? `Narakasura fell in ${stats.time} seconds` : 'Rode with Krishna and Satyabhama', px + 230, py + 236);
  const logo = await svgImage(LOGO_SVG).catch(() => null); const lh = 150, lw = lh * 4764 / 6673; if (logo) g.drawImage(logo, CW / 2 - lw / 2, 1000, lw, lh);
  g.textAlign = 'left'; g.fillStyle = C.white; g.font = `600 30px ${OUT}`; const brand = 'ARCGX TECHLABS', sp = 12; let tw = 0; for (const ch of brand) tw += g.measureText(ch).width + sp; tw -= sp; let bx = CW / 2 - tw / 2; for (const ch of brand) { g.fillText(ch, bx, 1210); bx += g.measureText(ch).width + sp; }
  g.textAlign = 'center'; g.fillStyle = C.cyan; g.font = `400 21px ${OUT}`; g.fillText('Geospatial Intelligence', CW / 2, 1246);
  const where = /^https?:/.test(location.protocol) && !/claude\.ai|claudeusercontent|localhost/.test(location.host) ? (location.host + location.pathname).replace(/\/index\.html$/, '').replace(/\/$/, '') : 'www.arcgx.in';
  g.fillStyle = C.light; g.font = `500 22px ${INT}`; g.fillText(where === 'www.arcgx.in' ? where : `Play the story at ${where}`, CW / 2, 1300);
  return new Promise((res) => c.toBlob((b) => res(b), 'image/png'));
}
export function fileName() { const p = gs().player || 'friend'; return `arcgx-diwali-card-${p.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'friend'}.png`; }
export function shareText() { const { player, score } = gs(); return `Happy Diwali from ${player}! I rode with Krishna and Satyabhama and brought down Narakasura with ${fmt(score)} points in the ArcGX TechLabs Diwali story.`; }
