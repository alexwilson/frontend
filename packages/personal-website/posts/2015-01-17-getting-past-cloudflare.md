---
layout: post
title: Getting past CloudFlare
id: 09b2a1eb-4a1f-4087-b261-79ceee6e2bc6
date: 2015-01-17 15:00
author: alex
tags: [cloudflare]
threadId: axgy-1436715775088
---

[CloudFlare] is a wonderful thing. An excellent DNS provider coupled with a hosted "intelligent" caching reverse proxy? Sign me up!

Moreover, some of the functionality offered up by [CloudFlare] can only be described as awesome - From the ability to project a WAF over your entire site, to automatically minifying all static assets, to even offer a proprietary ESI alternative in the form of [RailGun](https://www.CloudFlare.com/railgun).

CloudFlare has powered my site, that of [StormBit], the Pomf.se hosting service and countless others that I've been involved with over the past few years and all without a single hitch.  Alongside saving us bandwidth and offering lighting-fast DNS updates, unlimited DNS entries and flexible SSL, it has also kept sites serving content even when they have been down, or under heavy load.  With [CloudFlare] I can honestly say that small websites finally have a way of ensuring sites don't suffer the Slashdot effect.

However this is not intended to be an advert for [CloudFlare].  Rather I have been hit with their "I'm under attack mode", which is all well and good when one is actually under attack as it almost completely negates the ability of bots to hit applications and make away with precious bandwidth.  Unfortunately I'm not quite a bot, and instead of trying to steal bandwidth or steal email addresses, I'm trying to scrape information (for playlists) from websites which is at least a tiny bit less insidious.

Looking over how CloudFlare decides whether or not I am a bot, it evaluates Javascript in the browser to solve a challenge, and this challenge is per-domain, per-IP, per-session and per-useragent so I can't just solve the challenge once and add it to all my cookie jars.  Additionally, there is no sane way of manually adding all of the required cookies to new cookie jars, so that's not an option either.

My most immediate thought was to try and solve by guessing patterns and capturing values with regular expressions, however CloudFlare's engineers are several steps ahead and are actually obfuscating their challenge payload.

After trying a bit of trickery in node.js to try and capture and evaluate the challenge, I realised that there's already a far simpler way around this- Using a browser testing engine such as PhantomJS.

Ten minutes later, I had whipped together the following, which at time of writing allows my scraping tools past CloudFlare with negligable failures.

`gist:alexwilson/f4f084b87946f84a89b4`

[CloudFlare]:   https://www.CloudFlare.com/         "CloudFlare"
[RailGun]:      https://www.CloudFlare.com/railgun  "CloudFlare RailGun"
[StormBit]:     https://www.stormbit.net/         "CloudFlare"

*[WAF]: Web Application Firewall
*[ESI]: Edge Server Includes
