const clientId = OAUTH_CLIENT_ID;
const clientSecret = OAUTH_CLIENT_SECRET;
const authUrl = `https://github.com/login/oauth/authorize`;
const tokenUrl = "https://github.com/login/oauth/access_token";

const headers = {
  "Content-Type": "text/html;charset=utf-8",
  "Cache-Control": "private, no-cache, no-store, max-age=0",
  "X-XSS-Protection": "1; mode=block",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "unsafe-url",
  "Feature-Policy": "none",
};

function getScript(mess, content) {
  return `<!doctype html><html><body><script>
  (function() {
    function receiveMessage(e) {
      console.log("receiveMessage %o", e)
      window.opener.postMessage(
        'authorization:github:${mess}:${JSON.stringify(content)}',
        e.origin
      )
      window.removeEventListener("message",receiveMessage,false);
    }
    window.addEventListener("message", receiveMessage, false)
    console.log("Sending message: %o", "github")
    window.opener.postMessage("authorizing:github", "*")
    })()
  </script></body></html>`
};

export const auth = async (url) => {
  const params = [
    `client_id=${clientId}`,
    `scope=${url.searchParams.get("scope") || "repo,user"}`
  ]
  const response = Response.redirect(`${authUrl}?${params.join('&')}`);
  return response;
};

export const authCallback = async (url) => {
  const data = {
    code: url.searchParams.get("code"),
    client_id: clientId,
    client_secret: clientSecret,
  };

  try {
    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json;charset=utf-8",
      },
      body: JSON.stringify(data),
    });
    const result = await response.json();

    if ('error' in result) {
      throw new Error(response.error, result);
    }

    return new Response(getScript('success', {
      token: result.access_token,
      provider: "github"
    }), {
      status: 200,
      headers
    });
  } catch (err) {
    return new Response(getScript('error', err), { status: 401, headers });
  }
};