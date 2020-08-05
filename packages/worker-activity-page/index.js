import React from "react"
import {renderToString} from "react-dom/server"

const Layout = props => {
  return <html>
    <head>
      <title>{props.title}</title>
    </head>
    <body>{props.children}</body>
  </html>
}

const TestPage = _ => {
  return <Layout title="test">
    <div>Activity</div>
  </Layout>
}

const render = component => `<!DOCTYPE html>${renderToString(component)}`

self.addEventListener("fetch", event => {
  const renderedReact = render(<TestPage />);
  event.respondWith(new Response(renderedReact), {
    headers: {
      'content-type': 'text/html'
    }
  });
});

