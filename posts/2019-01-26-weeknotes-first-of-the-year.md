---
layout: post
title: "Weeknotes: First Of The Year — 26th January 2019"
date: 2019-01-26
author: alex
image: https://alexwilson.tech/pictures/20190126--railway-bridge.jpg
image_credit: Photo by Alex Wilson.
tags: ['weeknotes', 'bio', 'imagecdn', 'kubernetes', 'reliability', 'slack', 'metroid', 'software-quality']
---

Gotcha. Sorry, no, this isn’t [the song by Skrillex](https://www.youtube.com/watch?v=2cXDgFwE13g). These are the first weeknotes I’ve published of 2019, hopefully soon to be followed by my retrospective of 2018.

### From resizing images to infrastructure problems
- After migrating the original version of the application to Kubernetes last year, this week (specifically, Sunday) [I updated ImageCDN to v2](https://github.com/imagecdn/imagecdn/blob/master/CHANGELOG.md), a rewrite in Node. I placed a strong emphasis on trying to improve its concurrency as I found that the greatest limitation with PHP and PHP-PM was that it was very easy to overload the service and bring it down. 
- Along the way of rewriting the ImageCDN core I had a lot of fun learning about [libvips](https://jcupitt.github.io/libvips/), which is a superb if somewhat underrated image processing library. With more-or-less the same file-size output as ImageMagick, libvips is able to produce better, more-accurate images with significantly less memory usage. Hopefully I will be able to use it in future projects. Expect a write-up!
- Why the move back from Kubernetes?  It’s a really nice technology but it isn’t deploy-and-forget when dealing with non-trivial workloads despite the hype. Cluster maintenance is required as time goes on, and to be effective it is essential to allocate a healthy portion of the cluster resources to monitoring and observability activities. Which adds up pretty quickly. For a free service this meant a lot of operational overhead and a pretty costly cluster.

### Di-slack-tions
- My experiment with Slack [has had an interesting result](https://twitter.com/antoligy/status/1088183564770992135).
- At first I got a lot of comments from people mildly irritated that I was no longer immediately reachable, but overall it has been ok. Seeing this success I started rolling this change out to my other messaging apps, and started using email a little bit more for managing notifications.
- Now I have noticed an interesting behaviour pattern: When I've sent a message or I am expecting a reply from someone (say I am in a Slack conversation), I actively go into a "polling loop", cycling between the task I am working on and the messaging platform I am expecting a reply on. It's certainly better than before, but is definitely still rather draining.

### Quality
- I’m doing a talk! At [BrumJS on the 19th of March](https://www.meetup.com/meetup-group-MzfqIqCy/events/fppxlqyzfbzb/). My topic is is software quality, how it is largely misunderstood, how only a small portion can be handled by “QA”, and then how to measure and improve it. I will be writing it up after-the-fact.

---

- Nintendo seem to have restarted development on Metroid Prime 4, which sounds bad. Actually it's great news: Now Retro Studios are taking the reigns. My nostalgia bias is incredibly happy that Retro is picking this up, by my nostalgic inner-child is upset that this means the release date has been pushed back indefinitely. I [Dread](https://en.wikipedia.org/wiki/Metroid_Dread) to think how long we might have to wait.

- I’ve started planning a holiday to visit Hong Kong: Asia is incredibly exciting region and I’m quite thrilled to explore a new city!
- Booking flights led me into the rabbit-hole of British Airways’ outfit of Airbus A380s and all of the quirks. Most amusing is Seat 25D: It is a standard, economy-class seat with all of the usual amenities of British Airways Economy. However, row 24 skips seat D to allow an escape-hatch for the crew’s cabin underneath, meaning that 25D includes double the normal leg-room. On its own, this isn’t too exciting, but BA took this in stride and reserved all of these seats for their Silver-tier members and up, charging a little extra for the seat with the promise of free champagne.