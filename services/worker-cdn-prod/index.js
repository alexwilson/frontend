addEventListener('fetch', event => {
    event.respondWith(process(event.request))
  })
  
  async function process(request) {
  
    let response;
    try {
  
      // vcl_recv
      const backendResponse = await receive(request)
  
      // vcl_fetch
      const fetchResponse = await originFetch(request, backendResponse)
  
  
      response = fetchResponse.clone();
    } catch (e) {
      response = await error(request, e)
    }
  
    // Allow logging to happen asynchronously
    log(request, response)
  
    return await deliver(request, response);  
  }
  
  /**
   * @param {String} URL to redirect to
   */
  function redirectTo(url) {
    return Response.redirect(url)
  }
  
  /**
   * Equivalent to vcl_recv
   * @param {Request} request
   */
  async function receive(req) {
    console.log('vcl_recv', req)
  
    const requestUrl = new URL(req.url)
  
    switch (requestUrl.host) {
      case 'antoligy.com':
      case 'ax.gy':
        return redirectTo(
          requestUrl.href.replace(requestUrl.host, 'alexwilson.tech')
        );
    };

    const redirects = await fetch('https://alexwilson.tech/redirects.json')
      .then(res => res.json())
      .catch(() => {})
    if (redirects && redirects[requestUrl.pathname]) {
      return redirectTo(`https://alexwilson.tech${redirects[requestUrl.pathname]}`)
    }
  
    switch (requestUrl.pathname) {
      case '/cv': {
        return redirectTo(
          'https://docs.google.com/document/d/1SlrbctqUQlhBtODC8c12Qft66b8j69jV1CSVcrYqdq0/'
        )
      }
      case '/book-a-time': {
        return redirectTo(
          'https://doodle.com/mm/alexwilson/00'
        )
      }
    }
  
    return fetch(req)
  }
  
  /**
   * Equivalent to vcl_fetch
   * @param {Request} request
   * @param {Response} response
   */
  async function originFetch(req, resp) {
    console.log('vcl_fetch', req, resp)
    const responseHeaders = new Headers(resp.headers)
    const responseStatusCode = resp.status
  
    if (responseStatusCode >= 500) {
      throw new Error("An error occurred")
    }
  
    return new Response(resp.body,
      Object.assign({}, resp, {
        headers: responseHeaders,
        body: undefined
      })
    )
  }
  
  /**
   * Equivalent to vcl_error
   * @param {Request} request
   * @param {Error} error
   */
  async function error(req, obj) {
    console.log('vcl_error', req, obj)
    const errorBody = `
    <!DOCTYPE html>
    <HTML>
      <body>
        <p>An unexpected error occurred!</p>
      </body>
    </HTML>
    `
    return new Response(errorBody, {
      headers: new Headers({
        "content-type": "text/html"
      }),
      status: 500,
      statusText: "INTERNAL SERVER ERROR"
    })
  }
  
  /**
   * Equivalent to vcl_deliver
   * @param {Request} request
   * @param {Response} response
   */
  async function deliver(req, resp) {
    console.log('vcl_deliver', req, resp)
    resp.http = new Headers(resp.headers)
  
      if (resp.http.has("content-type") && resp.http.get("content-type").includes("text/html")) {
      const securityHeaders = {
        "Content-Security-Policy" : "upgrade-insecure-requests",
        "Strict-Transport-Security" : "max-age=1000",
        "X-Xss-Protection" : "1; mode=block",
        "X-Frame-Options" : "DENY",
        "X-Content-Type-Options" : "nosniff",
        "Referrer-Policy" : "strict-origin-when-cross-origin",
      }
  
      Object.keys(securityHeaders).map((name, index) => {
        resp.http.set(name, securityHeaders[name])
      })
    }
  
    return new Response(resp.body,
      Object.assign({}, resp, {
        headers: resp.http,
        http: undefined,
        body: undefined
      })
    )
  }
  
  /**
   * Equivalent to vcl_log
   * @param {Request} req
   * @param {Response} resp
   */
  async function log(req, resp) {
  
    // const logEntry = {};
  
    // fetch(`https://bigquery.googleapis.com/bigquery/v2/projects/personal-website-277723/datasets/cdn_prod/tables/cdn_prod/insertAll?key=${BIGQUERY_API_KEY}`, {
    //   body: JSON.stringify({
    //     "kind": string,
    //     "skipInvalidRows": boolean,
    //     "ignoreUnknownValues": boolean,
    //     "templateSuffix": string,
    //     "rows": [{
    //         "insertId": string,
    //         "json": {
    //             logEntry
    //         }
    //     }]
    //     }
    //   ),
    //   headers: {
  
    //   }
    // })
  
  }
