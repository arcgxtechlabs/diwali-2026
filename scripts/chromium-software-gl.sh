#!/usr/bin/env sh
# Launch Chromium with software WebGL fully enabled, for Remotion renders on machines without a GPU.
# remotion.config.ts points Remotion at this wrapper when a local Chromium is found.
BIN="${CHROMIUM_BIN:-}"
for c in /opt/pw-browsers/chromium /usr/bin/chromium /usr/bin/chromium-browser /usr/bin/google-chrome; do
  if [ -z "$BIN" ] && [ -x "$c" ]; then BIN="$c"; fi
done
exec "$BIN" --enable-unsafe-swiftshader --ignore-gpu-blocklist --use-gl=angle --use-angle=swiftshader "$@"
