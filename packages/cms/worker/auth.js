const clientId = OAUTH_CLIENT_ID;
const clientSecret = OAUTH_CLIENT_SECRET;
const authUrl = `https://github.com/login/oauth/authorize`;
const tokenUrl = "https://github.com/login/oauth/access_token";

function getScript(mess, content) {
  return `<!doctype html><html><body><script>
  (function() {
    function receiveMessage(e) {
      console.log("receiveMessage %o", e)
      window.opener.postMessage(
        'authorization:github:${mess}:${JSON.stringify(content)}',
        e.origin+"/cms"
      )
      window.removeEventListener("message",receiveMessage,false);
    }
    window.addEventListener("message", receiveMessage, false)
    console.log("Sending message: %o", "github")
    window.opener.postMessage("authorizing:github", "*")
    })()
  </script></body></html>`
}

export const auth = async (url) => {
  const params = [
    `client_id=${clientId}`,
    `scope=${url.searchParams.get("scope") || "repo,user"}`
  ]
  return Response.redirect(`${authUrl}?${params.join('&')}`);
}

export const authCallback = async (url) => {
  const data = {
    code: url.searchParams.get("code"),
    client_id: clientId,
    client_secret: clientSecret,
  };

  const headers = {
    "Content-Type": "text/html;charset=utf-8",
    "Cache-Control": "no-cache, no-store"
  };

  try {
    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
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
}