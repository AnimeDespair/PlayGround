#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

PROJECT_DIR="$(pwd)"
PORT="${PORT:-3000}"
WEB_DIR="${OPENCODE_WEB_DIR:-${RUNNER_TEMP:-$PROJECT_DIR}/omgithub-web}"
SOURCE_DIR="$PROJECT_DIR/site"
BUILD_DIR="$PROJECT_DIR/dist"

timed() {
  /usr/bin/time -p "$@"
}

timed mkdir -p "$WEB_DIR" "$BUILD_DIR"
timed /usr/bin/printf '{"project":"%s","directory":"%s"}\n' "$PROJECT_DIR" "$BUILD_DIR" > "$WEB_DIR/deployment-output.json"

if [[ -f "$PROJECT_DIR/package.json" ]]; then
  if [[ -f "$PROJECT_DIR/package-lock.json" ]]; then
    timed npm ci --no-audit --no-fund
  else
    timed npm install --no-audit --no-fund
  fi
  if timed node -e 'const p=require("./package.json");process.exit(p.scripts&&p.scripts.build?0:1)'; then
    timed npm run build
  fi
else
  [[ -f "$SOURCE_DIR/index.html" ]] || { echo "Missing static source: $SOURCE_DIR/index.html" >&2; exit 1; }
  timed rm -rf "$BUILD_DIR"
  timed mkdir -p "$BUILD_DIR"
  timed cp -R "$SOURCE_DIR"/. "$BUILD_DIR"/
fi

[[ -f "$BUILD_DIR/index.html" ]] || { echo "Built output is missing index.html: $BUILD_DIR" >&2; exit 1; }

echo "Serving $BUILD_DIR on 0.0.0.0:$PORT"
exec /usr/bin/time -p node "$PROJECT_DIR/server.mjs" "$BUILD_DIR" "$PORT"
