import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { existsSync, readFileSync, renameSync } from 'node:fs'
import { resolve } from 'node:path'

const LOCAL_PROXY_PATH = '/__middlerates'
const LOGO_DATA_URL = `data:image/png;base64,${readFileSync(resolve(process.cwd(), 'img/logo.png')).toString('base64')}`

const readJsonBody = async (request: NodeJS.ReadableStream): Promise<unknown> => {
  let body = ''
  for await (const chunk of request) body += String(chunk)
  return JSON.parse(body)
}

// https://vite.dev/config/
export default defineConfig({
  publicDir: false,
  build: {
    assetsInlineLimit: 100_000,
  },
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    {
      name: 'inline-logo-favicon',
      transformIndexHtml: {
        order: 'pre',
        handler: (html) => html.replace('__PROXYRATE_LOGO__', LOGO_DATA_URL),
      },
    },
    viteSingleFile(),
    {
      name: 'rename-production-html',
      closeBundle() {
        const buildDirectory = resolve(process.cwd(), 'dist')
        const indexPath = resolve(buildDirectory, 'index.html')
        if (existsSync(indexPath)) {
          renameSync(indexPath, resolve(buildDirectory, 'proxyrate.html'))
        }
      },
    },
    {
      name: 'middlerates-local-proxy-bridge',
      configureServer(server) {
        server.middlewares.use(LOCAL_PROXY_PATH, async (request, response) => {
          if (request.method !== 'POST') {
            response.statusCode = 405
            response.end('Method not allowed')
            return
          }

          try {
            const body = await readJsonBody(request)
            const data = typeof body === 'object' && body !== null ? body as Record<string, unknown> : {}
            const endpoint = typeof data.endpoint === 'string' ? data.endpoint : ''
            const userId = typeof data.userId === 'string' ? data.userId.trim() : ''
            const sessionCookie = typeof data.sessionCookie === 'string' ? data.sessionCookie.trim() : ''
            const accessToken = typeof data.accessToken === 'string' ? data.accessToken.trim() : ''
            const target = new URL(endpoint)
            const isNewApi = request.url?.startsWith('/newapi')
            const isSub2Api = request.url?.startsWith('/sub2api')

            if (!['http:', 'https:'].includes(target.protocol)) throw new Error('Endpoint must use HTTP or HTTPS')
            if (!isNewApi && !isSub2Api) throw new Error('Unsupported proxy platform')

            const headers: Record<string, string> = { Accept: 'application/json' }
            if (isNewApi) {
              if (userId) headers['New-Api-User'] = userId
              if (sessionCookie) headers.Cookie = `session=${sessionCookie}`
            }
            if (isSub2Api && accessToken) headers.Authorization = `Bearer ${accessToken}`

            const upstream = await fetch(target, { headers })
            response.statusCode = upstream.status
            response.setHeader('Content-Type', upstream.headers.get('content-type') ?? 'application/json')
            response.end(Buffer.from(await upstream.arrayBuffer()))
          } catch (error) {
            response.statusCode = 502
            response.setHeader('Content-Type', 'application/json')
            response.end(JSON.stringify({ message: error instanceof Error ? error.message : 'Local bridge request failed' }))
          }
        })
      },
    },
  ],
})
