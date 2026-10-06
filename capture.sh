#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
if [[ -z "${CAPTURE_URL:-}" ]]; then echo "Set CAPTURE_URL." >&2; exit 1; fi
if [[ -z "${CAPTURE_DIR:-}" ]]; then echo "Set CAPTURE_DIR." >&2; exit 1; fi
if [[ -z "${RUNTIME_DIR:-}" ]]; then echo "Set RUNTIME_DIR." >&2; exit 1; fi
/usr/bin/time -p mkdir -p "$CAPTURE_DIR"
/usr/bin/time -p node "${RUNTIME_DIR}/scripts/default-capture.mjs"
/usr/bin/time -p ls -l "$CAPTURE_DIR/final-desktop.png" "$CAPTURE_DIR/final-mobile.png"
