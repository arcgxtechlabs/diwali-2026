import { Config } from '@remotion/cli/config';
import { existsSync } from 'node:fs';
import path from 'node:path';

Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
Config.setConcurrency(1);
Config.setChromiumOpenGlRenderer('swangle');
// The app imports with the "@/" alias (see tsconfig paths); teach Remotion's bundler the same alias.
Config.overrideWebpackConfig((cfg) => ({ ...cfg, resolve: { ...cfg.resolve, alias: { ...((cfg.resolve && cfg.resolve.alias) || {}), '@': path.resolve(process.cwd(), 'src') } } }));
// On a machine without a GPU (CI, render boxes) use the local Chromium through a wrapper that enables
// software WebGL with float render targets, which the post-processing stack needs.
const local = ['/opt/pw-browsers/chromium', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome'].find((p) => existsSync(p));
if (local && !process.env.REMOTION_USE_DOWNLOADED_CHROME) Config.setBrowserExecutable(path.resolve(process.cwd(), 'scripts/chromium-software-gl.sh'));
