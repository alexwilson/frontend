import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: false,
  },
  resolve: {
    // decap-cms-ui-default ships both a webpack-bundled CJS main and an ESM
    // module entry. Vite would normally prefer `module`, but `main` wins for
    // packages without an `exports` field in some resolution paths — and the
    // webpack-bundled CJS expects webpack's module runtime, not Vite's, so
    // it explodes inside jsdom (icons end up rendered as raw SVG strings,
    // jsdom rejects the attempted element name). Aliasing to the ESM build
    // bypasses the issue.
    alias: {
      'decap-cms-ui-default': 'decap-cms-ui-default/dist/esm/index.js',
    },
  },
})
