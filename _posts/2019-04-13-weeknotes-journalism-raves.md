---
layout: post
title: "Weeknotes: Journalism Raves — 13th April 2019"
date: 2019-04-13
author: alex
image: https://alexwilson.tech/pictures/20190413--bracken-house.png
image_credit: Photo by Alex Wilson.
tags: ['weeknotes', 'talks', 'career', 'financial-times', 'microservices', 'personal-development']
---

## Bracken House

- The FT is moving back to Bracken House soon. Most of my group had our inductions this week. It's very, very nice.
- During our induction an audio engineer was tuning the event space's sound system with [Four Tet's Only Human](https://open.spotify.com/track/4waVSC9eSkrt6RxJK3DhwW?si=JKspSCaaQDWApKTrc1tctA):
    Bring on the journalist raves.
- There aren't any coffee machines. 🙃
- The photo behind this blog post is of the gorgeous sundial decorating the original entrance to the building,
    featuring a mug-shot of Winston Churchill.
- ... just in time really, because it turns out that the current building, One Southwark Bridge, has an infestation of
    mice. This week I've seen them attempting to conquer the land beneath my boss's desk.
    _It's the weekend now so they've probably won._


## Micro-frontends

- This week I've been thinking about the concept of micro-frontends, after reading [an incredibly good article](https://hackernoon.com/understanding-micro-frontends-b1c11585a297)
    by [Öner Zafer](https://twitter.com/onrzfr) explaining what they are, why they're useful and how to go about
    building them.  I love the theory and it's something that the FT does.
- It's difficult to maintain isolation and to keep boilerplate to a minimum. For changes spanning multiple apps, these
    now require a lot of management and tooling (either to bring the apps into one place, i.e. a monorepo, or to repeat
    the changes across many repositories) which can be tiresome for a team.
- Conversely, it's if isolation is successful, it can be really hard to share code.  The latest way my team tackled the
    problem has been to subtree-split at CI and publish components to Github/NPM.  This is limiting and still requires
    manual intervention to "bump" the dependencies on a per-application basis!
- It's also hard to draw boundaries (but maybe this is a team-organisation thing?) between applications, for instance
    the difference between the app-shell, a utility component used by two-or-more services (but not all) and components
    used by individual apps only.
- A particular library/solution introduced by Öner, [Project Mosiac](https://www.mosaic9.org), looks like it offers
    some good answers to these problems by taking away ownership of the app-shell from a given application, delegating
    those to a layout service, called Tailor — which is orchestrated by the Routing tier — and by enforcing standards
    to shared code (in the form of the shared component/utility library, Shaker). I'm keen to explore this approach
    next to see if it solves the problems I've outlined above.

## QA is not Quality

- Last weekend I put up the video for my talk, QA is not Quality:
    [You can watch it here](https://alexwilson.tech/talks/2019-03-19-qa-is-not-quality-brumjs/).
- I actually gave this thing in March, this was my first public speaking experience in quite some time and overall I'm
    glad that I did it. I started off nervous, got into stride, and then lost it a little bit later in. People overall
    have been incredibly nice and positive about it and apparently there was some demand for the VOD/slides, so I think
    I'd like to do it again.
- Now I'm thinking about how to try and write this thing up, and I think really it makes sense to break it down (as I
    did within the talk itself) by category into a series and to write-up a mini-guide for each.
- Keen for feedback on the talk and its content, if you have any please get in touch!
- Next up, I'm speaking at BrumPHP in April about CDNs!

---

- [Alice's weaknotes series is really nice.](https://alicebartlett.co.uk/blog/weaknotes)
- Between jobs I made a Johari window which was an incredibly rewarding, and uniquely insightful experience. You can
    [read about it here](https://alexwilson.tech/blog/2019/04/14/taking-a-look-through-a-johari-window/).
- The secret to becoming an influencer on LinkedIn?  [Be incredibly positive](https://ovaledge.com/data-analytics-oleg/).
- The human race made an incredibly big breakthrough this week, in the form of the Black-Hole Initiative generating an
    image of a black-hole. *Go humanity!* Like with all good news, this has somehow generated controversy. Which I had
    [some opinions on](https://twitter.com/antoligy/status/1117076648933888002). If you contributed to this project in
    any way, shape or form, *thank-you*.
- I subscribed to [HBR](https://hbr.org/) and you should too! They have incredibly good content on equality and
    building a strategy (primarily for business, but really for just about anything). I also really like the format and
    structure of their [Dear HBR](https://hbr.org/2018/01/podcast-dear-hbr) podcast which delves into topics like
    mixed feedback in the workplace and dealing with complex emotions.
