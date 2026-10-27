#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

if [[ -z "${CAPTURE_URL:-}" ]]; then
  echo 'Set CAPTURE_URL to the exact preview URL to capture.' >&2
  exit 1
fi
if [[ -z "${CAPTURE_DIR:-}" ]]; then
  echo 'Set CAPTURE_DIR to a directory outside the project source.' >&2
  exit 1
fi
if [[ -z "${RUNTIME_DIR:-}" ]]; then
  echo 'Set RUNTIME_DIR to the OMGithub runtime.' >&2
  exit 1
fi

PROJECT_ROOT="$(pwd)"
CAPTURE_ROOT="$(realpath -m "$CAPTURE_DIR")"
if [[ "$CAPTURE_ROOT" == "$PROJECT_ROOT" || "$CAPTURE_ROOT" == "$PROJECT_ROOT/"* ]]; then
  echo 'CAPTURE_DIR must be outside the project source tree.' >&2
  exit 1
fi
export CAPTURE_DIR="$CAPTURE_ROOT"

/usr/bin/time -p mkdir -p "$CAPTURE_DIR"
/usr/bin/time -p node "${RUNTIME_DIR}/scripts/default-capture.mjs"
/usr/bin/time -p test -s "$CAPTURE_DIR/final-desktop.png"
/usr/bin/time -p test -s "$CAPTURE_DIR/final-mobile.png"
/usr/bin/time -p ls -l "$CAPTURE_DIR/final-desktop.png" "$CAPTURE_DIR/final-mobile.png"
