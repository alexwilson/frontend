variable "domains" {
  description = "A list of domain names to be used"
  type        = list(string)
}

variable "backends" {
  description = "A list of backends"
  type = list(object({
    address           = string
    name              = string
    host              = string
    port              = number
    use_ssl           = bool
    ssl_cert_hostname = string
  }))
}
