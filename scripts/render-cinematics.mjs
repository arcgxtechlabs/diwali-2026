#!/usr/bin/env node
/** Render every Remotion cinematic to out/<id>.mp4 (and the trailer when registered). */
import { execSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
mkdirSync('out', { recursive: true });
const ids = ['title', 'chapter', 'banner', 'impact', 'krishnaFalls', 'gates', 'charge', 'victory', 'dawn', 'finale', 'trailer'];
for (const id of ids) {
  try { execSync(`npx remotion render video/index.ts ${id} out/${id}.mp4 --log=error`, { stdio: 'inherit' }); }
  catch (e) { console.error(`render failed for ${id}`); }
}
