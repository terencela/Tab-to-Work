#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/safari"

echo "Converting Tab to Work extension for Safari…"
rm -rf "$OUT"

xcrun safari-web-extension-converter "$ROOT" \
  --app-name "Tab to Work" \
  --bundle-identifier "com.tabtowork.extension" \
  --swift \
  --copy-resources \
  --project-location "$OUT" \
  --force

echo ""
echo "Done. Open: $OUT/Tab to Work/Tab to Work.xcodeproj"
echo "Then Product → Run, and enable in Safari → Settings → Extensions."
