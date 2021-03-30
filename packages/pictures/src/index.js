addEventListener('fetch', function(event) {
    event.respondWith(handleRequest(event.request))
});

const ORIGIN = "https://d2yriqampkvcut.cloudfront.net";
async function handleRequest(request) {
    const {pathname} = new URL(request.url)
    const url = new URL(pathname.replace(/^\/pictures/, ''), ORIGIN);
    return await fetch(url, { "cf": { "cacheEverything": true, ttl: 14*24*60*60 } });
}
