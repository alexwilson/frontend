sub vcl_recv {
    if (req.http.CF-RAY) {
        set req.http.Fastly-Client-IP = req.http.CF-Connecting-IP;
    }
}

sub vcl_deliver {
    if (req.http.CF-RAY) {
        set resp.http.Cloudflare-CDN-Cache-Control = "must-understand, max-age=60, must-revalidate";
    }
}
