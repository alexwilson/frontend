domains        = ["test.alexwilson.tech"]
backends = [
  {
    address          = "alexwilson.github.io"
    host             = "alexwilson.tech"
    name             = "main"
    port             = 443
    use_ssl          = true
    ssl_cert_hostname = "alexwilson.github.io"
  }
]
