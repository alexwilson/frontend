output "zone_id" {
  description = "The ID of the Cloudflare zone"
  value       = cloudflare_zone.zone.id
}

output "page_rules" {
  description = "The page rules created"
  value       = cloudflare_page_rule.rules
}
