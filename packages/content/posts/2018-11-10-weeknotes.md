---
layout: post
title: Weeknotes — 10th November 2018
id: 8739b291-45f5-4f98-89b0-f6881d940ca2
date: 2018-11-10 23:19
last_modified_at: 2018-11-11 14:01
author: alex
image: https://images.unsplash.com/photo-1541794728130-050e3d8b81d6?ixlib=rb-0.3.5&q=85&fm=jpg&crop=entropy&w=2000&cs=srgb&s=0ee7b2389a3682794326519e742bec65
image_credit: Photo by Colin Watts.
tags: ['weeknotes', 'dns']
---

This week has had a strong theme of self-reflection, off of the back of researching and forward-planning for one project, and running a team workshop to start building out a new technical stack.

- After neglecting it for a long time, StormBit’s DNS is now partially automated. I built a new tool for idempotently managing DNS records within a zone, and have hooked it into the same CI process which manages and distributes server configurations, meaning that now DNS is completely democratised. [I’ve written up some of the reasoning and methodology here](https://alexwilson.tech/blog/2018/11/10/democratising-and-automating-dns/).
- In actually building this thing there was the opportunity to start using Golang 1.11 modules which turn out to be seamless, hassle-free and actually incredibly awesome if also poorly documented. Really fantastic that there’s so much investment of time and effort into improving Golang’s developer experience.

### Reflections

- This week I have been reading [Thinking: Fast and Slow](https://www.amazon.co.uk/dp/0141033576) and it provides a great model for examining interactions. Aside from prompting me to reexamine many concepts and conversations which I have taken as "just so", because I may have avoided exerting the effort to check their logical consistency, I have lately become so easily distractible that I have forgotten the joy and value of reading. As a theme for coming weeks, I will be paying more attention to my energy levels and to trying to introduce unitasking.
- This week has also been pretty rough. Maybe it’s related to the clocks going back and is an early indication of SAD but motivation feels harder. On the upside, [Gyrosco.pe](gyrosco.pe) have updated their mood tracking and have (apparently) added a feature to nag mood check-ins, so hopefully I’ll be able to get some useful data out of it.
- It was my mother’s birthday this week and together with my sister we out for dinner to celebrate. It’s kind-of surreal how different the dynamic is now that we’re all a group of adults, leading entirely and completely different lives. I suppose it’s not that big a deal since every other family will have gone through this same transition at some stage, but it’s quite remarkable to have gone through it.

---

- Loads of good conferences on this week: In no particular order, *Sharp intake of breath*. FFConf, PerfNow, WebPerfDays Amsterdam, muConf, SeaGL, DACHFest and P3X. Seems like by far this was this busiest conf week all year! Wish I could’ve gone to most of these because they all sounded awesome: Oh well, at least I got to play with a JamBoard.
- Holy carp there’s a lot of hype going on right now about React Hooks. Haven’t had a chance to look yet, but going by [examples like this one, implementing slider interactions](https://codesandbox.io/embed/387p7vo9z5) we may see much more portable user experience pattern libraries springing up. Also these seem like a good replacement for mixins?
- [The FT hosted NodeGirlsLondon today](https://twitter.com/nodegirlslondon/status/1061306448125267974). Nice work to everybody involved!
- With Black Friday coming up, an interesting tidbit came up during conversation this week: [Singles Day generated $3B for AliBaba in just a couple of minutes](https://twitter.com/juokaz/status/1061367299918217217). I can’t help but wonder how much revenue will be generated this season. At peak, $1 million per minute was spent last year. Can we top that?
- [Missing: The island of Esanbehanakitakojima. Have you seen it?](https://www.washingtonpost.com/world/2018/11/03/japanese-island-quietly-disappeared-no-one-noticed-until-now/) In all seriousness, coastal erosion is scary and climate change is making it happen quicker.  And it’s happening—rather quietly—[at an unprecedented rate in the UK](https://www.bbc.co.uk/news/science-environment-45983260). Don’t know about you but I’m not a fantastic swimmer.
