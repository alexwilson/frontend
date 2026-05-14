import index from "../dist/index.html";

addEventListener('fetch', function(event: Event) {
  const fetchEvent = event as FetchEvent;
  fetchEvent.respondWith(handleRequest(fetchEvent.request));
});

async function handleRequest(_request: Request): Promise<Response> {
  return new Response(index, {
    headers: {
      "content-type": "text/html;charset=UTF-8",
      "cache-control": "max-age=600, must-revalidate"
    },
  })
}
