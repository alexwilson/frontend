terraform {
  required_providers {
    fastly = {
      source  = "fastly/fastly"
      version = ">= 3.1"
    }
  }
}

locals {
  vcl         = fileset("${path.module}/vcl", "*.vcl")
  module_root = path.module
}

resource "fastly_service_vcl" "cdn" {
  name = "cdn-${var.environment}"

  dynamic "domain" {
    for_each = var.domains
    content {
      name = domain.value
    }
  }

  dynamic "backend" {
    for_each = var.backends
    content {
      address           = backend.value["address"]
      name              = backend.value["name"]
      port              = backend.value["port"]
      override_host     = backend.value["host"] != "" ? backend.value["host"] : backend.value["address"]
      use_ssl           = backend.value["use_ssl"]
      ssl_check_cert    = true
      ssl_cert_hostname = backend.value["ssl_cert_hostname"]
    }
  }

  dynamic "vcl" {
    for_each = local.vcl
    content {
      name = vcl.value
      main = vcl.value == "main.vcl" ? true : false
      content = templatefile("${path.module}/vcl/${vcl.value}", {
        module_root : path.module
      })
    }
  }
}
