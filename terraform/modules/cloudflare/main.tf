terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}

resource "cloudflare_zone" "zone" {
  account_id = var.account_id
  zone       = var.zone
}

resource "cloudflare_page_rule" "rules" {
  for_each = { for rule in var.redirect_rules : rule.target => rule }
  zone_id  = cloudflare_zone.zone.id
  target   = each.value.target
  actions {
    forwarding_url {
      url         = each.value.forward_to
      status_code = 301
    }
  }
}
