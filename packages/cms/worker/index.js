addEventListener('fetch', function(event) {
  event.respondWith(handleRequest(event.request))
});

const ORIGIN = "https://static.alexwilson.tech";
async function handleRequest(request) {
  const {pathname} = new URL(request.url);
  const url = new URL(pathname, ORIGIN);
  return await fetch(url, { "cf": { "cacheEverything": false, ttl: 60 } });
}
