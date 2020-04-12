---
layout: post
title: Weeknotes — 3rd November 2018
id: 44499e4f-fc44-44a4-9aa2-9d59c5dffe85
date: 2018-11-3 15:41
last_modified_at: 2018-11-3 15:41
image: https://images.unsplash.com/photo-1506606401543-2e73709cebb4?ixlib=rb-0.3.5&q=85&fm=jpg&crop=entropy&cs=srgb&s=a2c389bef52afa5b61e4f22842f2ae96
image_credit: Photo by Zac Ong.
tags: ['weeknotes']
author: alex
---

Predominantly this week I’ve been working to reverse engineer, document and test a subscription system.  What should have been a simple handover exercise has turned into an excellent case-study for process improvements around making sure that business-critical systems aren’t only captured in institutional knowledge.  People _naturally_ move on, and so these crucial facts are sometimes lost to time.  It’s a well-equipped team which makes sure that doesn’t cause problems, and a well-equipped team is what we’re trying to build.  _Playing BA is fun, sometimes I wish I’d taken that career path._

#### Definition as a driver of software quality
- Recently I’ve been thinking a lot about quality in software engineering, and more specifically how to ensure it.  Quality Assurance as a role in a team seems to go through cycles of being undervalued when it’s identified as slowing things down, and then being overvalued when people notice a reduction in quality: I’ve just gone through this cycle myself and am now enamoured with the principles of agile QA (as described in [Jeff Patton and Peter Economy's User Story Mapping](https://www.amazon.co.uk/User-Story-Mapping-Discover-Product-ebook/dp/B00NF07FHS)).
- Reducing everything that around this topic and looking at the problem of ensuring quality primarily from a _process_ perspective, the primary driver seems to be definition: Defining when a feature is done, and what other things need to be considered.  I’ll try to write something more coherent on the matter at a later stage, *ideally* with a real-world case-study.

#### Github's Incident on the 21st of October
- [Github have put together a fantastically detailed RCA](https://blog.github.com/2018-10-30-oct21-post-incident-analysis/) on the service disruption last week. At its core, it was caused by a 43 second network outage which resulted in enough lag to completely throw off Github's MySQL clustering. The post is fascinating and highly worth a read, and is also an example of the kind of incredible work they're doing on a day to day basis. However I can't help but wonder, since GitHub aren't a MySQL High Availability company, what the cost/benefit to continue rolling their own HA database clustering is. Outages aside, the engineering effort alone must cost a healthy chunk of change, so hopefully the overall storage cost and latency savings are well worth it.

#### Apple’s October Event
- Apple’s October event came and went!  A new MacBook Air is making the rounds, and Apple have wisely included the Touch ID sensor in a standard generation 3 keyboard so that it’s still affordable. However it still starts at over $1000.  The new Mac Mini looks like a fantastic desktop experience: I reckon coupled with an eGPU it’ll more than serve as a capable replacement for mine. Nice upgradeability, however incredibly costly for what they actually are.  Overall these compute upgrades are super nice, however it's very alarming and disappointing that the prices have shot up so much: It seems like Apple is no longer the obvious choice for students.
- Then the iPad Pro: USB-C, an edge-to-edge form factor, and enhanced security; Nearly everything I’ve wanted in a tablet.  If only I could use iOS as a development environment, I’d pick one up in a heartbeat. Also it sounds like the aluminium shavings from manufacturing these are what is going into the new recycled unibodies of the MacBook Air and Mac mini.
- No mention of AirPower.  Zero-surprise.
- Also, Apple really ought to add haptic feedback to a future version of the TouchBar!

---
- In the news this week, things have been pretty hectic: Angela [Merkel is stepping down as the leader of the CDU in Germany](https://www.economist.com/europe/2018/11/03/angela-merkel-will-step-down-as-cdu-party-leader-in-december), [Arron Banks is under investigation](https://www.bbc.co.uk/news/uk-politics-46056337) by the National Crime Agency for suspected fraud ([and the FT has reported](https://www.ft.com/content/1bbda93c-deb4-11e8-9f04-38d397e6661c)) his business holdings were worth a maximum of £1.75m.
- “Dozens of people around the world were killed because of this.” — If there was ever any doubt as to the importance of internal whistleblowing and taking cyber-security seriously, then [this story about the CIA neglecting their systems—more importantly their people—should end that](https://www.yahoo.com/news/cias-communications-suffered-catastrophic-compromise-started-iran-090018710.html).  No responsibility, or accountability, frankly very outrageous.  On a side-note it’s great to see Yahoo News breaking cybersecurity news: Hopefully after multiple crushing blows, they’ve entered into a new chapter?
- Rather quietly, [Stephen Hawking worried about the side-effects of genetic manipulation](https://www.washingtonpost.com/news/morning-mix/wp/2018/10/15/stephen-hawking-feared-race-of-superhumans-able-to-manipulate-their-own-dna/): How even starting out with the best of intentions, a human race given the ability to write its own evolutionary future would inevitably start improving traits to the point of developing a race of so-called “super-humans”, leaving those less able in the proverbial dust.  Flashbacks to Huxley’s Brave New World describes a similar future, in which this is carefully planned: But today we’re not that organised. I hope Huxley and Hawking are *both* wrong. I hope we have a kind future.
