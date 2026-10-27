import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, join, resolve, sep } from 'node:path'

const root = resolve(process.argv[2] || 'dist')
const port = Number(process.env.PORT || process.argv[3] || 3000)

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.wasm': 'application/wasm',
  '.glb': 'model/gltf-binary'
}

async function findFile (pathname) {
  let decoded
  try {
    decoded = decodeURIComponent(pathname)
  } catch {
    return null
  }
  const candidate = resolve(root, '.' + decoded)
  if (candidate !== root && !candidate.startsWith(root + sep)) return null
  try {
    const info = await stat(candidate)
    if (info.isDirectory()) {
      const index = join(candidate, 'index.html')
      const indexInfo = await stat(index)
      return indexInfo.isFile() ? index : null
    }
    return info.isFile() ? candidate : null
  } catch {
    return null
  }
}

const server = createServer(async (request, response) => {
  const method = request.method || 'GET'
  if (method !== 'GET' && method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD', 'Content-Type': 'text/plain; charset=utf-8' })
    response.end('Method Not Allowed')
    return
  }

  const url = new URL(request.url || '/', 'http://localhost')
  let file = await findFile(url.pathname)

  if (!file && !extname(url.pathname)) {
    try {
      const fallback = join(root, 'index.html')
      if ((await stat(fallback)).isFile()) file = fallback
    } catch {}
  }

  if (!file) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache' })
    response.end('Not found')
    return
  }

  response.setHeader('Content-Type', types[extname(file).toLowerCase()] || 'application/octet-stream')
  response.setHeader('Cache-Control', 'no-cache')
  response.setHeader('X-Content-Type-Options', 'nosniff')

  if (method === 'HEAD') {
    response.writeHead(200)
    response.end()
    return
  }

  const stream = createReadStream(file)
  stream.on('error', error => {
    console.error(error)
    if (!response.headersSent) response.writeHead(500)
    response.end('Read error')
  })
  response.writeHead(200)
  stream.pipe(response)
})

server.listen(port, '0.0.0.0', () => {
  console.log(`Hermius serving ${root} on http://0.0.0.0:${port}`)
})

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    server.close(() => process.exit(0))
    setTimeout(() => process.exit(0), 3000).unref()
  })
}
