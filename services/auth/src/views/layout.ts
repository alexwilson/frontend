// Page shell — the `<html><head><body>` wrapper, CSS bundle, and the tiny
// vanilla-JS sprinkle for `data-confirm` submit guards. Pure: takes props,
// returns string. No Hono / Request / DB access.
//
// The shared CSS lives here so every view in this directory inherits the
// same Pico + customisations. Page-specific styling can be added by the
// view via extraStyles.
import picoCss from '@picocss/pico/css/pico.min.css'
import { CUSTOM_CSS } from './components'
import { esc } from './components'

export interface PageOpts {
  title?: string
  /** Optional HTML rendered on the right side of the header (e.g. user email). */
  headerRight?: string
  /** Header title text on the left. Defaults to "auth". */
  headerTitle?: string
  body: string
  flash?: { kind: 'ok' | 'err'; text: string }
  /** Extra CSS appended after CUSTOM_CSS — page-specific overrides if needed. */
  extraStyles?: string
}

export function page(opts: PageOpts): string {
  const { title = 'auth', headerRight, headerTitle = 'auth · manage', body, flash, extraStyles } = opts
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="color-scheme" content="light dark"/>
<title>${esc(title)}</title>
<style>${picoCss}</style>
<style>${CUSTOM_CSS}</style>
${extraStyles ? `<style>${extraStyles}</style>` : ''}
</head><body>
<main class="container">
<header class="app-header">
  <strong>${esc(headerTitle)}</strong>
  ${headerRight ?? ''}
</header>
${flash ? `<div class="flash flash-${flash.kind}">${esc(flash.text)}</div>` : ''}
${body}
</main>
${CONFIRM_JS}
</body></html>`
}

// Wired by any view that emits `<form data-confirm="...">` — JS prompt
// before submit. Inline because it's three lines and not worth a separate
// asset hop.
const CONFIRM_JS = `<script>
document.querySelectorAll('form[data-confirm]').forEach(function(f){
  f.addEventListener('submit', function(e){
    if(!confirm(f.getAttribute('data-confirm'))) e.preventDefault()
  })
})
</script>`
