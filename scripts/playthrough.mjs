#!/usr/bin/env node
/**
 * Automated playthrough with headless Chromium: types a name, plays both chapters with the
 * keyboard auto-aim, draws the final arrow, and reports every scene change with timings.
 *   node scripts/playthrough.mjs [url] [outDir] [WxH]
 */
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
const require = createRequire(import.meta.url);
const pwPath = process.env.PLAYWRIGHT_PATH || (() => { try { return require.resolve('playwright'); } catch { return '/opt/node-tools/node_modules/playwright/index.js'; } })();
const { chromium } = require(pwPath);
const [url = 'http://localhost:4173/', outDir = '/tmp/playthrough', size = '1280x720'] = process.argv.slice(2);
const [w, h] = size.split('x').map(Number); mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message)); page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto(url, { waitUntil: 'networkidle' });
await page.fill('#name', 'Suneel'); await page.click('button[type=submit]');
const t0 = Date.now(); let last = ''; let shots = 0; const log = (s) => console.log(`${((Date.now() - t0) / 1000).toFixed(1)}s  ${s}`);
const deadline = Date.now() + 6 * 60 * 1000;
while (Date.now() < deadline) {
  const st = await page.evaluate(() => { const g = window.__diwali; const s = g.store.getState(); return { scene: s.scene, narration: !!s.narration, talk: !!s.talk, score: s.score, lives: s.lives, bossHp: s.bossHp, drawing: s.drawing, finalDraw: s.finalDraw, foes: g.sim.foes.length, t: g.sim.t, cine: s.cinematic?.id || null }; });
  if (st.scene !== last) { log(`scene -> ${st.scene}  (score ${st.score}, lives ${st.lives}, bossHp ${st.bossHp})`); last = st.scene; await page.waitForTimeout(600); await page.screenshot({ path: `${outDir}/${String(++shots).padStart(2, '0')}-${st.scene}.png` }); }
  if (st.scene === 'closing') break;
  if (st.narration) { await page.waitForTimeout(900); await page.mouse.click(w * 0.5, h * 0.55); continue; }
  if (st.talk) { await page.waitForTimeout(700); await page.click('#guide .btn'); continue; }
  if (st.scene === 'ride' || st.scene === 'battle' || st.scene === 'rage') { await page.evaluate(() => window.__diwali.director.keyFire()); await page.waitForTimeout(420); continue; }
  if (st.scene === 'final') { await page.evaluate(() => window.__diwali.director.beginDraw()); await page.waitForTimeout(2600); await page.evaluate(() => window.__diwali.director.releaseFinal()); await page.waitForTimeout(500); continue; }
  await page.waitForTimeout(400);
}
const final = await page.evaluate(() => { const s = window.__diwali.store.getState(); return { scene: s.scene, score: s.score, stats: s.stats }; });
log(`finished: ${JSON.stringify(final)}`);
if (errors.length) { console.log('ERRORS:'); console.log([...new Set(errors)].slice(0, 20).join('\n')); }
await browser.close();
process.exit(final.scene === 'closing' ? 0 : 1);
