#!/usr/bin/env node
/**
 * Screenshot the game or a showcase with headless Chromium (SwiftShader WebGL).
 *   node scripts/screenshot.mjs "<url>" out.png [waitMs] [WxH]
 * Uses the Playwright found on the machine (PLAYWRIGHT_PATH overrides the module path).
 */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const pwPath = process.env.PLAYWRIGHT_PATH || (() => { try { return require.resolve('playwright'); } catch { return '/opt/node-tools/node_modules/playwright/index.js'; } })();
const { chromium } = require(pwPath);
const [url = 'http://localhost:4173/', out = 'shot.png', waitMs = '2500', size = '1280x720'] = process.argv.slice(2);
const [w, h] = size.split('x').map(Number);
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
const logs = [];
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(`[${m.type()}] ${m.text()}`); });
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(Number(waitMs));
await page.screenshot({ path: out });
const unique = [...new Set(logs)].filter((l) => !/Remotion|AudioContext|THREE.Clock/.test(l));
if (unique.length) console.log(unique.slice(0, 30).join('\n'));
console.log(`saved ${out}`);
await browser.close();
