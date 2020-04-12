---
layout: post
title: Democratising and automating DNS
id: 4828db22-33da-4554-8651-696128c17e17
date: 2018-11-10 23:19
author: alex
tags: [cloudflare, dns, devops]
---

Today I have released an infrastructure automation tool, [called DNSSync](https://github.com/stormbit/dnssync), for idempotently managing the state of DNS records.

```bash{promptUser: alex}{outputLines: 2-5}
dnssync --provider=cloudflare --state=state.json
2018/11/10 00:34:19 Evaluating: irc.stormbit.net type A
2018/11/10 00:34:19 Nothing to do!
2018/11/10 00:34:19 Evaluating: irc.stormbit.net type AAAA
2018/11/10 00:34:19 Nothing to do!
```

This is by no means the first tool in this space but it does address a few specific needs. It is also exposed both as a command line tool and as an application library which means that it is useful for small automations, as well as more customised and bespoke ones.

### Why not use Terraform instead?
Terraform is one of my favourite tools: Amongst other things I’m using it to manage my Google Cloud account, and my teams use it for managing and testing our Fastly properties (a topic for another time).

While it’s a great first most of the time, Terraform doesn’t fit all use-cases all of the time, and in this case specifically for [managing Cloudflare](https://www.terraform.io/docs/providers/cloudflare/index.html):
 - The configuration format for Cloudflare DNS is very brittle: It manages entire zones at a time, meaning you must declare _everything_ or risk losing it.
 - Terraform’s management of state-files is notoriously risky in mixed-ability teams which impairs its accessibility.
 - Terraform isn’t designed for just-in-time dynamic configuration changes. The case may be made that actually a CDN/DNS provider Cloudflare isn’t either, but more modern use-cases of edge infrastructure really rely on it. In fact Cloudflare Workers support dynamic origin selection and Cloudflare Apps support dynamic record alterations, but both only work for HTTP requests.

Ultimately DevOps is not about repurposing tools such as Terraform, but about solving operational problems: Here, our use-case was just a little bit too far outside of the remit of anything which already existed, hence the new tool.

### StormBit’s use of DNSSync
StormBit is now using DNSSync as a component of its infrastructure modernisation and democratisation efforts.
We use Cloudflare as a DNS provider, because we don’t have the capacity or expertise to run and support our own DNS. The fewer bits of infrastructure we are responsible for, the better.

Cloudflare doesn’t allow us to have versioned, access controlled access to a particular zone so democractising access to maintain these records has always been a problem with key-man dependencies: This was our main priority, and so now we have [baked DNSSync into](https://github.com/stormbit/servicedeploy) our configuration management toolchain to apply zone state for all types of irc.stormbit.net records.

More long-term, as IRC uses DNS for routing users, the library interface exposed by DNSSync allows us to persist the current state of the service registry even as it changes, meaning that these records will be automatically kept up to date whenever IRC servers are added or removed from the pool. For our users, they won’t ever be routed to unhealthy nodes and that’s pretty awesome.

---

You can grab DNSSync and its source here: [DNSSync](https://github.com/stormbit/dnssync)
Contributions welcome!
