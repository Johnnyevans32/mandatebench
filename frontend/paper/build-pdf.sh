#!/usr/bin/env bash
# Render the paper HTML source to frontend/public/mandatebench.pdf.
# The HTML in this directory is the single source of truth for the PDF —
# edit it, run this script, commit both.
set -euo pipefail
cd "$(dirname "$0")"

CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
if [ ! -x "$CHROME" ]; then
  CHROME="$(command -v google-chrome || command -v chromium || true)"
fi
if [ -z "$CHROME" ]; then
  echo "error: Chrome/Chromium not found (set CHROME=/path/to/chrome)" >&2
  exit 1
fi

"$CHROME" --headless --disable-gpu --no-pdf-header-footer \
  --print-to-pdf="$(pwd)/../public/mandatebench.pdf" \
  "file://$(pwd)/mandatebench-paper.html"

echo "wrote ../public/mandatebench.pdf"
