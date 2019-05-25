---
layout: post
title: "Weeknotes: Jetlag City — 1st December 2018"
date: 2018-12-01 23:19
last_modified_at: 2018-12-01 15:11
author: alex
image: https://alexwilson.tech/pictures/20181201--shinkyo-autumn.jpg
image_cropped: https://alexwilson.tech/pictures/20181201--shinkyo-autumn--cropped.jpg
image_credit: Photo by Alex Wilson.
tags: ['weeknotes', 'aws', 'bio', 'japan', 'nar']
---

This week has been one of battling through extremely severe jet-lag. My brain has been like jello. 
What’s most frustrating is the research and prep-work I tried to avoid the worst effects by attempting to acclimatise ahead of the flight and by deliberately minimising my sleep on the plane to make sure that I’d be exhausted. IT DID NOT WORK.
- Jetlag is a symptom of chronobiology. Us humans are diurnal, meaning we adapted to live around the pattern of solar radiation, normally 24 hours. When we disrupt this, even one system (like say, the digestive system) going out of sync can send every other one haywire. Even if you think you're fine, jetlag will probably have affected you in some way.
- JetlagRooster produces sensible plans.  [I sort-of stuck to one](http://d.ax.gy/cBCq2b+)  Still did not help.  Maybe there’s something wrong with me?
- I brought some of my leftover [HVMN Yawn](https://hvmn.com/yawn) with me, which proved to be the killer blow on my second night after I spent several hours tossing and turning (whilst stubbornly staying in bed, in a darkened room, praying for sweet, sweet sleep).  Had totally forgotten how good HVMN’s products were, maybe I should buy some more?

[Spin City, by Chris Grimes](https://www.ft.com/content/17bd2042-2221-11e8-9a70-08f715791301) is easily one of my favourite pieces of writing from this year and mirrors a lot of the same sense of awe and intrigue which has inspired my own interest in Tokyo. Granted walking through Tower Records in Akihabara shortly after landing, the only thing spinning was my head. "Jetlag city", as it were.

My team launched [the new NAR homepage, and honestly, it looks pretty great](https://twitter.com/antoligy/status/1067682123706904576)!  Kudos to everybody involved.  If this sort of thing is of interest to you, both [the FT](https://ft.wd3.myworkdayjobs.com/en-US/FT_External_Careers) and [Bluetel are currently hiring](https://www.bluetel.co.uk).

More quietly I have started looking at tooling to make sure that the content on the homepage is up-to-date, by diffing the latest state from the application logs against the website front-end, to artificially report on whenever something is amiss: This is important because as the dynamic nature of our website means occasional rendering errors are sometimes caught in caches for quite some time.
For anyone building a high-traffic, slow-changing page I strongly recommend building it statically (i.e. when something has changed, and not when a reader has requested the page). The cache-invalidation work required will _not_ be easy, but the resiliency and robustness at that point which come for free from serving a static object _almost entirely from cache_ will be well worth it.

Here are some rough notes ...

- For a webpage ("A") make sure it is tagged with _its own_ unique identifier.
- For a webpage ("A") referencing another article ("B") in any shape or form (e.g. card, teaser or link), tag the webpage ("A") with the article's ("B") unique identifier.
- For an article ("B") with its own webpage, tag the article ("B") with its most portable unique identifier.
- When the webpage ("A") changes, purge/rebuild the webpage ("A") by its own unique identifier.
- When the article ("B") changes, purge/rebuild the article ("B") by its own unique identifier and the webpage by the article's unique identifier ("A").
- When adding (or changing) a reference to another article ("C") in the webpage ("A"), purge/rebuild the webpage ("A"), tagging it with all articles' unique identifiers ("B", "C").

_(n.b. Tagging is additive: A page can have multiple tags. e.g. [Varnish XKey](https://docs.varnish-software.com/varnish-cache-plus/vmods/xkey/).)_

#### Nikko!

At the weekend I took a trip to Nikkō, just north of Tokyo. It's a stunning place, especially during the autumn: Vibrant shades of deep red ranging through to electric yellow: I've never quite seen an autumn like it.  Nikko is home to plenty of stunning scenery, [including many waterfalls](https://www.japan-guide.com/e/e3812.html), and a [now disused ceremonial bridge](https://www.japan-guide.com/e/e3814.html) leading foot traffic out into the middle of a busy road.  However what drew my attention about the area was the [Toshugu Shrine](https://www.japan-guide.com/e/e3801.html) which is known for being the most intricately detailed shrine complex in all of Japan.

![Mizaru, Kikazaru and Iwazaru](/pictures/20181201--monkeys.jpg "Mizaru, Kikazaru and Iwazaru")

Toshugu amongst other things houses an early "See no evil, hear no evil, speak no evil" carving. It might be one of the earliest depictions of the three monkeys Mizaru, Kikazaru and Iwazaru; however, there is very little reliable information available on the origins of these monkeys.
Reading some literature at the temple, this particular version was carved by Hidari Jingoro and is the 2nd panel of an 8-panel carving telling the story of living a good life.
The story is one of preserving innocence. In this story, _children should see no evil, should hear no evil and will speak no evil_. Exposure to any of these carries a negative effect: Seeing or hearing evil, it becomes part of our physical being and becomes us and seeks an outlet in our actions, including speaking evil. So if we see no evil, and hear no evil, there will be no evil in us to speak. We are the sum of our inputs.

In reading background material on the topic, it certainly seems like there have been some misunderstandings around the general premise of the monkeys. In fact it's entirely possible that this read is also wrong ([but at least I'm not alone!](https://blog.gaijinpot.com/see-no-evil-hear-no-evil-speak-no-evil/)). But maybe this is for the best: There's something quite poetic about these three wise monkeys silently teaching generations life lessons.