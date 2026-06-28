import { existsSync, mkdirSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

import react from "@vitejs/plugin-react"
import { NodePackageImporter } from "sass"
import { defineConfig, type Plugin } from "vite"
import { VitePWA } from "vite-plugin-pwa"

const here = dirname(fileURLToPath(import.meta.url))
const nodeModules = join(here, "node_modules")

// The worker inlines ../dist/index.html; emit a stub on dev startup so `vite`
// and `wrangler dev` can run in parallel without a prior build (the shell branch
// is unused in dev). `vite build` produces the real one for prod.
function emitWorkerShellStub(): Plugin {
  return {
    name: "reader:emit-worker-shell-stub",
    apply: "serve",
    configResolved() {
      const dist = join(here, "dist")
      mkdirSync(dist, { recursive: true })
      const file = join(dist, "index.html")
      if (!existsSync(file)) writeFileSync(file, "<!doctype html><title>Reader (dev)</title>\n")
    },
  }
}

// The DS SCSS uses webpack `~pkg` imports; resolve them against node_modules
// (sass then does partial/extension lookup). `pkg:` → NodePackageImporter.
const tildeImporter = {
  findFileUrl(url: string) {
    return url.startsWith("~") ? pathToFileURL(join(nodeModules, url.slice(1))) : null
  },
}

export default defineConfig(({ mode }) => ({
  // Prod: assets load from the static origin (the worker serves only HTML + API).
  // Dev: from the dev server. Router basename stays /reader either way.
  base: mode === "production" ? "https://static.alexwilson.tech/reader/" : "/reader/",
  plugins: [
    react(),
    emitWorkerShellStub(),
    VitePWA({
      registerType: "autoUpdate",
      // Registered manually against the worker origin (a SW must be same-origin).
      injectRegister: false,
      workbox: {
        // No precache — assets are cross-origin; one self-contained sw.js to proxy.
        globPatterns: [],
        navigateFallback: null,
        inlineWorkboxRuntime: true,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith("/reader/api/"),
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "reader-api",
              cacheableResponse: { statuses: [200] },
              expiration: { maxEntries: 64, maxAgeSeconds: 86_400 },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  css: {
    preprocessorOptions: { scss: { importers: [new NodePackageImporter(), tildeImporter] } },
  },
  server: {
    // Tunnel host: Vite binds localhost and rejects foreign Host headers by default.
    host: true,
    allowedHosts: ["local.alexwilson.tech"],
    proxy: {
      "/reader/api": { target: "http://localhost:8787", changeOrigin: true },
    },
  },
}))
