import { defineConfig, passthroughImageService } from 'astro/config'
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import { remarkRewriteImages } from './src/plugins/remark-rewrite-images.mjs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { fileURLToPath } from 'node:url';
import { transformSync } from 'esbuild';
import { createRequire } from 'node:module';
import { readFileSync, existsSync } from 'node:fs';

const require = createRequire(import.meta.url);

// Vite plugin to redirect relative content images to media domain.
// Astro extracts image refs from markdown before remark plugins run,
// so we intercept at Vite resolveId to avoid ImageNotFound errors.
function contentImageRedirect() {
  const mediaDomain = 'https://media.alexwilson.tech/';
  const imageExts = /\.(png|jpg|jpeg|gif|svg|webp)$/i;
  return {
    name: 'content-image-redirect',
    enforce: 'pre',
    resolveId(id) {
      // Match bare image filenames with Astro's content image flag
      if (id.includes('astroContentImageFlag') && imageExts.test(id.split('?')[0])) {
        const base = id.split('?')[0];
        const filename = base.split('/').pop();
        // Only handle bare filenames (not absolute/node_modules paths)
        if (filename === base || (!base.startsWith('/') && !base.includes('node_modules'))) {
          return { id: `${mediaDomain}${filename}`, external: true };
        }
      }
    },
  };
}

// Vite plugin to handle .js files containing JSX (legacy-components uses .js for JSX)
function legacyComponentsJsx() {
  return {
    name: 'legacy-components-jsx',
    enforce: 'pre',
    transform(code, id) {
      if (id.endsWith('.js') && id.includes('legacy-components') && code.includes('React')) {
        const result = transformSync(code, {
          loader: 'jsx',
          jsx: 'automatic',
          format: 'esm',
        });
        return { code: result.code, map: result.map || null };
      }
    },
  };
}

// Custom Sass importer for webpack-style ~ imports (handles pnpm strict layout)
function resolveScssModule(bare) {
  // Try various resolution strategies for Sass files in node_modules
  const parts = bare.split('/');
  const lastPart = parts[parts.length - 1];
  const dirPart = parts.slice(0, -1).join('/');

  // Attempt variations: direct, with .scss, with _ prefix (Sass partial)
  const variations = [
    bare,
    bare + '.scss',
    bare + '.css',
    dirPart + '/_' + lastPart + '.scss',
  ];

  for (const v of variations) {
    try {
      return require.resolve(v);
    } catch {}
  }

  // Fallback: manual path construction from node_modules
  const nmDir = path.resolve('./node_modules');
  for (const v of variations) {
    const full = path.join(nmDir, v);
    if (existsSync(full)) return full;
  }
  return null;
}

const tildeImporter = {
  canonicalize(url) {
    if (!url.startsWith('~')) return null;
    const bare = url.substring(1);
    const resolved = resolveScssModule(bare);
    if (resolved) return pathToFileURL(resolved);
    return null;
  },
  load(canonicalUrl) {
    const filePath = fileURLToPath(canonicalUrl);
    const contents = readFileSync(filePath, 'utf-8');
    const syntax = filePath.endsWith('.sass') ? 'indented' : filePath.endsWith('.css') ? 'css' : 'scss';
    return { contents, syntax };
  },
};

export default defineConfig({
  site: 'https://alexwilson.tech',
  trailingSlash: 'never',
  image: {
      service: passthroughImageService()
  },
  integrations: [
    react(),
    sitemap(),
  ],
  markdown: {
    remarkPlugins: [
      remarkRewriteImages,
    ],
    shikiConfig: {
      theme: 'one-dark-pro',
    },
  },
  vite: {
    plugins: [contentImageRedirect(), legacyComponentsJsx()],
    optimizeDeps: {
      esbuildOptions: {
        loader: {
          '.js': 'jsx',
        },
      },
    },
    resolve: {
      alias: {
        '@reach/router': path.resolve('./src/components/AstroLinkAdapter.jsx'),
        '@alexwilson/legacy-components/src/link': path.resolve('./src/components/AstroLinkAdapter.jsx'),
        '@alexwilson/legacy-components/src/link/index.js': path.resolve('./src/components/AstroLinkAdapter.jsx'),
        'gatsby': path.resolve('./src/components/gatsby-shim.jsx'),
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler',
          silenceDeprecations: ['import', 'global-builtin', 'color-functions'],
          importers: [tildeImporter],
        },
      },
    },
  },
});
