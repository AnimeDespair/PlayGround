#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
PORT="${PORT:-3000}"
export PORT
PROJECT_ROOT="$(pwd)"
DIST_DIR="$PROJECT_ROOT/dist"
WEB_DIR="${OPENCODE_WEB_DIR:-/home/runner/work/_temp/omgithub-web}"
/usr/bin/time -p test -f "$DIST_DIR/index.html"
/usr/bin/time -p bash -c 'if [ -f package.json ]; then npm install --no-audit --no-fund; fi'
/usr/bin/time -p bash -c 'if [ -f package.json ]; then npm run build --if-present; fi'
/usr/bin/time -p mkdir -p "$WEB_DIR"
/usr/bin/time -p python3 -c "import json,os; web=os.environ.get('OPENCODE_WEB_DIR','/home/runner/work/_temp/omgithub-web'); root=os.getcwd(); dist=os.path.join(root,'dist'); open(os.path.join(web,'deployment-output.json'),'w').write(json.dumps({'project': root, 'directory': dist}))"
/usr/bin/time -p cat "$WEB_DIR/deployment-output.json"
/usr/bin/time -p python3 -c "import http.server,functools,os; port=int(os.environ.get('PORT','3000')); d=os.path.join(os.getcwd(),'dist'); h=functools.partial(http.server.SimpleHTTPRequestHandler,directory=d); print('Serving '+d+' on '+str(port),flush=True); http.server.ThreadingHTTPServer(('0.0.0.0',port),h).serve_forever()"
