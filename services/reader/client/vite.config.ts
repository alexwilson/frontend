import { existsSync, mkdirSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

import react from "@vitejs/plugin-react"
import { NodePackageImporter } from "sass"
import { defineConfig, type Plugin } from "vite"
import { VitePWA } from "vite-plugin-pwa"

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), "..")
const nodeModules = join(packageRoot, "node_modules")
const distDir = join(packageRoot, "dist")

function emitWorkerShellStub(): Plugin {
  return {
    name: "reader:emit-worker-shell-stub",
    apply: "serve",
    configResolved() {
      mkdirSync(distDir, { recursive: true })
      const file = join(distDir, "index.html")
      if (!existsSync(file)) writeFileSync(file, "<!doctype html><title>Reader (dev)</title>\n")
    },
  }
}

const tildeImporter = {
  findFileUrl(url: string) {
    return url.startsWith("~") ? pathToFileURL(join(nodeModules, url.slice(1))) : null
  },
}

export default defineConfig(({ mode }) => ({
  base: mode === "production" ? "https://static.alexwilson.tech/reader/" : "/reader/",
  build: { outDir: "../dist", emptyOutDir: true },
  plugins: [
    react(),
    emitWorkerShellStub(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: false,
      workbox: {
        globPatterns: [],
        navigateFallback: null,
        inlineWorkboxRuntime: true,
        runtimeCaching: [
          {
            urlPattern: ({ url, request }) =>
              url.pathname.startsWith("/reader/api/") && request.headers.has("authorization"),
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
    host: true,
    allowedHosts: ["local.alexwilson.tech"],
    proxy: {
      "/reader/api": { target: "http://localhost:8787", changeOrigin: true },
    },
  },
}))
