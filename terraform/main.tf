module "fastly" {
  source         = "./modules/fastly"
  domains        = var.domains
  backends       = var.backends
  environment    = terraform.workspace
}
