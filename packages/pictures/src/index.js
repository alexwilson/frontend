addEventListener('fetch', function(event) {
    event.respondWith(handleRequest(event.request))
});

async function handleRequest(request) {
    const {pathname} = new URL(request.url)
    const url = new URL(pathname.replace(/^\/pictures/, ''), "http://alex-images.s3-website.eu-west-1.amazonaws.com");
    return await fetch(url, { "cf": { "cacheEverything": true, ttl: 14*24*60*60 } });
}
