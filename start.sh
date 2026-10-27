#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

PORT="${PORT:-3000}"
export PORT
PROJECT_ROOT="$(pwd)"
DIST_DIR="$PROJECT_ROOT/dist"
WEB_DIR="${OPENCODE_WEB_DIR:-/home/runner/work/_temp/omgithub-web}"
export PROJECT_ROOT DIST_DIR WEB_DIR

/usr/bin/time -p test -d "$PROJECT_ROOT"

if [[ -f "$PROJECT_ROOT/package.json" ]]; then
  if [[ -f "$PROJECT_ROOT/package-lock.json" ]]; then
    /usr/bin/time -p npm ci --no-audit --no-fund
  else
    /usr/bin/time -p npm install --no-audit --no-fund
  fi
  /usr/bin/time -p npm run build --if-present
fi

/usr/bin/time -p test -f "$DIST_DIR/index.html"
/usr/bin/time -p mkdir -p "$WEB_DIR"
/usr/bin/time -p node -e '
  const fs = require("node:fs");
  const path = require("node:path");
  const project = path.resolve(process.env.PROJECT_ROOT);
  const directory = path.resolve(process.env.DIST_DIR);
  if (!directory.startsWith(project + path.sep)) throw new Error("Built output must stay inside PROJECT_DIR");
  const target = path.join(process.env.WEB_DIR, "deployment-output.json");
  fs.writeFileSync(target, JSON.stringify({ project, directory }));
  process.stdout.write(`Deployment output: ${target}\n${fs.readFileSync(target, "utf8")}\n`);
'
/usr/bin/time -p python3 -c '
import functools
import http.server
import os

port = int(os.environ.get("PORT", "3000"))
directory = os.environ["DIST_DIR"]

class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

handler = functools.partial(Handler, directory=directory)
server = http.server.ThreadingHTTPServer(("0.0.0.0", port), handler)
print(f"Serving {directory} on 0.0.0.0:{port}", flush=True)
server.serve_forever()
'
