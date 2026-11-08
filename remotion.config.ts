import { Config } from '@remotion/cli/config';
import { existsSync } from 'node:fs';

Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
Config.setConcurrency(2);
// Use a locally installed Chromium when one is present (CI containers and the ArcGX render box).
const local = ['/opt/pw-browsers/chromium', '/usr/bin/chromium', '/usr/bin/google-chrome'].find((p) => existsSync(p));
if (local) Config.setBrowserExecutable(local);
Config.setChromiumOpenGlRenderer('angle');
