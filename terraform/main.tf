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
  domains     = var.fastly_domains
  backends    = var.fastly_backends
  environment = terraform.workspace
}

module "cloudflare_antoligycom" {
  source     = "./modules/cloudflare"
  account_id = ""
  count      = terraform.workspace == "prod" ? 1 : 0
  zone       = "antoligy.com"
  redirect_rules = [{
    target     = "www.antoligy.com/*"
    forward_to = "https://ax.gy/$1"
    }, {
    target     = "antoligy.com/*"
    forward_to = "https://ax.gy/$1"
  }]
}

module "cloudflare_axgy" {
  source     = "./modules/cloudflare"
  account_id = ""
  count      = terraform.workspace == "prod" ? 1 : 0
  zone       = "ax.gy"
  redirect_rules = [{
    target     = "www.ax.gy/*"
    forward_to = "https://alexwilson.tech/$1"
    }, {
    target     = "ax.gy/*"
    forward_to = "https://alexwilson.tech/$1"
  }]
}
