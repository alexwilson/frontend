fastly_domains = ["alexwilson.tech"]
fastly_backends = [
  {
    address           = "alexwilson.github.io"
    host              = "alexwilson.tech"
    name              = "main"
    port              = 443
    use_ssl           = true
    ssl_cert_hostname = "alexwilson.github.io"
  }
]
fastly_honeycomb_dataset = "fastly:request"
