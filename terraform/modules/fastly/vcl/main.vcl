# Fastly Boilerplate based on: https://docs.fastly.com/en/guides/serving-stale-content
include "fastly-boilerplate-begin.vcl";

include "security-headers.vcl";

include "fastly-boilerplate-end.vcl";
