#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

: "${CAPTURE_URL:?Set CAPTURE_URL to the preview URL}"
: "${CAPTURE_DIR:?Set CAPTURE_DIR to an output directory outside the source tree}"
: "${RUNTIME_DIR:?Set RUNTIME_DIR to the worker runtime directory}"

export CAPTURE_READY_SELECTOR="${CAPTURE_READY_SELECTOR:-[data-app-ready=\"true\"]}"

timed() {
  /usr/bin/time -p "$@"
}

timed mkdir -p "$CAPTURE_DIR"
echo "Capturing $CAPTURE_URL -> $CAPTURE_DIR"
exec /usr/bin/time -p node "$RUNTIME_DIR/scripts/default-capture.mjs"
