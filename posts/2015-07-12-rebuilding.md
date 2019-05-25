---
layout: post
title: Rebuilding
date: 2015-07-12 15:00
author: alex
threadId: axgy-1436735845502
---

Like many others in the industry, when it comes to my own personal website I am incredibly lazy.  Sure, it's the first thing people see when they look me up, but even that isn't enough to prioritize it above my more interesting projects, both paid and otherwise.  However I have finally gone ahead and done it, and have now finished rebuilding my website only a year and a half after I said I would.

Before saying anything else, here is what my site had looked like since mid-2013: <img src="https://i.imgur.com/Ziq7Z3Jl.png" class="img-responsive align-center" />

My first decision when rebuilding was centered around the nature of my website: What do I need my website to show, and _what is it actually used for_?

- I _don't_ have fast-changing, dynamic content, and what I do want to serve isn't remotely user dynamic.
- I _don't_ need to sell anything, so considering e-commerce is silly.
- However I want to serve content that I will write occasionally (or regularly), for the world to see my thoughts, ramblings and musings on various topics.
- I would also like to display some information on what I've been working on.
- Maybe also put up a small profile for people to find.

Much of what needs to be dynamic on a website these days can actually be achieved in the browser through JavaScript - especially given the dawn of service workers ([Jake Archibald has written an excellent post on the subject here](http://jakearchibald.com/2014/offline-cookbook/)), but even then I don't actually need to do all that much, so there's no reason to complicate things with a dynamic website.  

Github have been running their Github Pages service on a static site generator called [Jekyll](https://jekyllrb.com/), which I've previously used to build the StormBit website, and other smaller projects.  It uses text-based storage, in the form of structured markdown documents, plus the Liquid templating language used by Shopify, so seemed perfect for my needs.  Plus, free hosting for the site, with git for source control.

Having settled on my hosting platform, and framework, the question was what should the site actually look like, and how should I build it?<br />
I've already experience with frameworks like Foundation and 960gs, but ultimately I wanted something simple, but extensible.  Twitter's bootstrap is particularly powerful, however I've never been a fan of jQuery as I feel it encourages poor practice and covers too much ground that should just be polyfilled (expect more on this in a future post), so immediately discounted it.  That is until I made the now-regrettable decision to buy this theme: 
<img src="https://i.imgur.com/rhry5Ye.jpg" class="img-responsive" />

Unfortunately the entire theme was written in LESS, so I had to convert it to Sass (which was a fairly painless task).  However after hacking at it a while, I realised that it was a stupid idea which relied on very different requirements to what I was trying to build and tore the entire thing down and started from scratch, on the design you are seeing now.  I again raised the question of Bootstrap vs. other frameworks, but then found the [Bootstrap.Native](http://thednp.github.io/bootstrap.native/) project which settled my doubts there and then.

Given how simple the site is, I felt it needed something to help it stand out from most other sides.  The background colour gives the site a lot of flavor and warmth, I chose it after digging around and looking at what other sites were doing.  I've been a huge fan of [Ethan Schnoover's Solarized](http://ethanschoonover.com/solarized) for years, and wanted to do something similar, so I built an entire palette around shades of Orange, brown and grey.  I think the overall result is fairly aesthetically pleasing, and plus is very simple to build on- In fact the entire palette is calculated automatically using Sass's darken() feature.

The last thing I should really touch on is that later in I decided to try and use PJAX for the site as much as possible, and in particular a library called InstantClick which pre-loads pages on mouseover to reduce the latency between pages.  While I didn't really have any issues with page load times (I built the entire thing using Chrome's throttling, set to 50kbps), coupled with CSS animations on links, this site feels virtually instant.
