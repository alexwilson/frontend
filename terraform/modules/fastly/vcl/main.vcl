# Fastly Boilerplate based on: https://docs.fastly.com/en/guides/serving-stale-content
include "fastly-boilerplate-begin.vcl";

include "cloudflare-service-chain.vcl";
include "security-headers.vcl";
include "redirects.vcl";
include "random-header-image.vcl";

include "fastly-boilerplate-end.vcl";
