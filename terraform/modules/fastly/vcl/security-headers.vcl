sub vcl_deliver {
    if (resp.http.content-type ~ "text/html") {
        set resp.http.Content-Security-Policy   = "upgrade-insecure-requests";
        set resp.http.Strict-Transport-Security = "max-age=1000";
        set resp.http.X-Xss-Protection          = "1; mode=block";
        set resp.http.X-Frame-Options           = "DENY";
        set resp.http.X-Content-Type-Options    = "nosniff";
        set resp.http.Referrer-Policy           = "strict-origin-when-cross-origin";
    }
}
