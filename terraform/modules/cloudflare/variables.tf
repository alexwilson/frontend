variable "account_id" {
  description = "Account ID"
  type        = string
  sensitive   = true
}

variable "zone" {
  description = "The domain zone to manage"
  type        = string
}

variable "redirect_rules" {
  description = "List of redirect rules to create"
  type = list(object({
    target     = string
    forward_to = string
  }))
}
