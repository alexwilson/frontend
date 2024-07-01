terraform {
  cloud {
    organization = "Alex_Wilson"
    workspaces {
      project = "platform"
      tags    = ["platform-environment"]
    }
  }
}

module "fastly" {
  source      = "./modules/fastly"
  domains     = var.domains
  backends    = var.backends
  environment = terraform.workspace
}
