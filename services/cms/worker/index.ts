import index from "../dist/index.html";

// Security headers for the CMS origin. The threat-model concern is XSS in
// Decap (or its dependency tree) being used to exfiltrate the ghu_* token
// we hand to the browser. CSP narrows the script/style/connect surface;
// even a permissive baseline blocks the easy "inject a <script> that POSTs
// the token to evil.example" path.
//
// Trade-offs honestly:
//   - 'unsafe-inline' on style-src: Decap uses Emotion CSS-in-JS, which
//     injects <style> tags. Removing this would need an Emotion nonce setup.
//   - 'unsafe-eval' on script-src: some Decap dependencies use Function()
//     constructor / eval(). Removing this would require auditing transitive
//     deps and likely upgrading several packages.
//   - script-src includes static.alexwilson.tech because the bundle lives
//     on the static origin (see webpack.client.cjs publicPath).
//   - connect-src is the load-bearing one — restricts where the token CAN
//     be sent. Lists only the origins Decap legitimately talks to.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.alexwilson.tech",
  "style-src 'self' 'unsafe-inline' https://static.alexwilson.tech",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://static.alexwilson.tech",
  "connect-src 'self' https://alexwilson.tech https://static.alexwilson.tech https://api.github.com https://uploads.github.com https://raw.githubusercontent.com",
  "frame-ancestors 'none'",
  "form-action 'self' https://github.com",
  "base-uri 'self'",
].join('; ')

const SECURITY_HEADERS: Record<string, string> = {
  "content-security-policy": CSP,
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "referrer-policy": "strict-origin-when-cross-origin",
  "permissions-policy": "interest-cohort=()",
  // 1 year + subdomains, no `preload`: we keep the ability to roll back to
  // HTTP if the deploy topology ever changes. Cloudflare's edge may also
  // set this — that's fine, identical values just collapse.
  "strict-transport-security": "max-age=31536000; includeSubDomains",
}

addEventListener('fetch', function(event: Event) {
  const fetchEvent = event as FetchEvent;
  fetchEvent.respondWith(handleRequest(fetchEvent.request));
});

async function handleRequest(_request: Request): Promise<Response> {
  return new Response(index, {
    headers: {
      "content-type": "text/html;charset=UTF-8",
      "cache-control": "max-age=600, must-revalidate",
      ...SECURITY_HEADERS,
    },
  })
}
