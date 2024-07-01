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

variable "environment" {
  description = "The environment name"
}

variable "honeycomb_dataset" {
  description = "Name of dataset to stream to in Honeycomb"
  type        = string
}

variable "honeycomb_token" {
  description = "Name of dataset to stream to in Honeycomb"
  sensitive   = true
  type        = string
}
