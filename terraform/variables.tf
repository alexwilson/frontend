variable "fastly_domains" {
  description = "A list of domain names to be used"
  type        = list(string)
}

variable "fastly_backends" {
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

variable "fastly_honeycomb_dataset" {
  description = "Honeycomb Dataset for streaming Fastly logs to"
  type        = string
}

variable "fastly_honeycomb_token" {
  description = "Write token for Fastly to stream to Honeycomb"
  type        = string
  sensitive   = true
}

variable "cloudflare_account_id" {
  description = "Cloudflare Account ID"
  type        = string
  sensitive   = true
}
