import index from "../dist/index.html";

addEventListener('fetch', function(event) {
  event.respondWith(handleRequest(event.request))
});

async function handleRequest(request) {
  return new Response(index, {
    headers: {
      "content-type": "text/html;charset=UTF-8",
      "cache-control": "max-age=600, must-revalidate"
    },
  })
}
