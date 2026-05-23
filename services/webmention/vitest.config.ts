import { defineConfig } from 'vitest/config'

export default defineConfig({
  // The CDK + lambda sources are TypeScript, but a stale `tsc` run can leave
  // compiled `.js` next to each `.ts`. Vite's default resolver picks `.js`
  // first, which makes tests run against stale code and silently miss
  // `vi.mock` rewrites. Force `.ts` to take precedence.
  resolve: {
    extensions: ['.ts', '.mjs', '.js', '.mts', '.jsx', '.tsx', '.json'],
  },
  test: {
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.ts', 'lib/**/*.ts'],
      exclude: [
        'bin/**',
        'scripts/**',
        'cdk.out/**',
        '**/*.d.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
})
