sub vcl_recv {
#FASTLY recv
}

sub vcl_hash {
  set req.hash += req.url;
  set req.hash += req.http.host;
  #FASTLY hash
}

sub vcl_hit {
#FASTLY hit
}


sub vcl_miss {
#FASTLY miss
}

sub vcl_pass {
#FASTLY pass
}

sub vcl_fetch {
  /* handle 5XX (or any other unwanted status code) */
  if (beresp.status >= 500 && beresp.status < 600) {

    /* deliver stale if the object is available */
    if (stale.exists) {
      return(deliver_stale);
    }

    if (req.restarts < 1 && (req.method == "GET" || req.method == "HEAD")) {
      restart;
    }
  }

  /* set stale_if_error and stale_while_revalidate (customize these values) */
  set beresp.stale_if_error = 86400s;
  set beresp.stale_while_revalidate = 60s;

#FASTLY fetch
}


sub vcl_error {
#FASTLY error
}


sub vcl_deliver {
#FASTLY deliver
}

sub vcl_log {
#FASTLY log
}
