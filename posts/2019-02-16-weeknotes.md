---
layout: post
title: "Weeknotes — 16th February 2019"
date: 2019-02-16
author: alex
image: https://alexwilson.tech/pictures/20190216--palais-de-justice.jpg
image_credit: Photo by Alex Wilson.
tags: ['weeknotes', 'podcasting', 'aws', 'fosdem']
---

It’s been a busy few weeks. But I think, overall, worthwhile. I will have some exciting news to share next week!

- Two weeks ago I went to [FOSDEM 2019](https://fosdem.org/2019/), which is run in Brussels. It was my first time in Belgium and even after struggling with a confusing subway system, I loved it. The conference itself was incredibly cool, and I actually began writing up some of the highlights in that week’s weeknotes but have given up as there was just too much going on.  [The photo is of the Palace of Justice, which has its own fun background.](https://www.instagram.com/p/BtcHVEHlfVG/).

---

- Spent the first half of this week learning about Nikkei’s approach to handling data warehousing and [the specifics](https://www.slideshare.net/HajimeSano1/jaws-ug-bigdata-branch-oct-2017) are [very impressive](https://www.slideshare.net/HajimeSano1/amazon-redshift-in-action).  There is an open-source web client-side tracking library that goes alongside it, and it’s particularly interesting because it implements a number of web performance tricks—including listening to requestAnimationFrame, queuing events to fire via beacon and using intersection observers to monitor page tracking—to minimise overhead to the user. [Its source is available here and is well worth a read](https://github.com/Nikkei/atlas-tracking-js).

---
 
- Over the past few years podcasts have been becoming a larger and larger part of my life, and if [various industry stats](https://musicoomph.com/podcast-statistics/)  have anything to say about it, I’m not alone.  They’re a very disruptive media form which nobody has really figured out.  This week [Spotify rather abruptly bought Gimlet media](https://www.macstories.net/news/spotify-acquires-podcast-producer-gimlet-media-and-app-maker-anchor/), one of the largest independent podcast networks out there, claiming to want to preserve its independence (both in general, and from Spotify’s distribution platform).
- Overall it’s an interesting MO, and Spotify seem to want to build out a regularly updated, spoken-word repertoire: Where music streaming is becoming increasingly competitive—and with music licensing increasingly combative—podcasting has been rather quiet, dominated by Apple and niche “power-user” services like Overcast and Pocket Casts. Since introducing their podcasting platform last year, Spotify has surged ahead and have become the [second largest podcast platform](https://podnews.net/update/spotify-number-2), rather incredibly by _adding to_ (and not taking from) market-share. So are podcasts the key to Spotify’s salvation?

---

- [AWS released a new iconset.](https://aws.amazon.com/architecture/icons/) I appreciate this probably doesn’t mean much to anyone, but I really didn’t like the old one. So, yay?
- On Thursday I went to the [Birmingham AWS Meetup](https://www.meetup.com/AWS-User-Group-West-Midlands/]) and learned about [Sysdig](https://sysdig.com), an incredibly cool debugging tool.  It reminds me a lot of the utility of eBPF, but has built-in eventing and so can be used to automate a stack. Their value proposition of “rich monitoring and eventing” is that it can be used as a user-land-level security tool in a container platform, and for example can be used to whitelist the system calls a given container can actually execute. And then adjust if you have misconfigured. Very cool stuff.
- This is by no means new, but I only found out about it this week.  Los-Angeles Metro commissioned some videos which I can only describe as  … I am not even really sure, but please give it a watch. It is glorious. [Metro Manners PSA: Super Kind – No loud music ミュジック - YouTube](https://www.youtube.com/watch?v=XdesfldDAhY)
- The Open University is offering [some courses for free](https://www.open.edu/openlearn/free-courses/full-catalogue). And the selection is actually pretty OK!