---
layout: post
title: "How GraphQL can help migrations and extraction projects"
date: 2020-01-19
author: alex
tags: ['graphql', 'legacy', 'migration']
---

There's a tonne of buzz around graphQL right now and it seems like virtually every platform is getting some kind of support for it.

Specifically I wanted to reflect on the use-case of graphQL when migrating or adapting application architectures.

If you're building a new thing and are extracting functionality piece-by-piece from your older system or systems, chances are your architecture looks like (or will look like) something like this.

![simple](/pictures/20200119/simple.png)

Great!  That's nice and elegant: The old system continues to support capabilities which the new system cannot yet deliver, buying valuable time to make sure that the functionality delivered is of high quality.

This is a bit high-level though, and especially as modern architecture has a strong bias for microservices it won't hurt to look at the details.  Thinking about the requirements of such a system ...

![new-but-super-messy](/pictures/20200119/new-but-super-messy.png)

Our problem is clear: There's a heavy number of dependencies on specific implementation details of the legacy systems, which will make migrating away considerably harder.

How can we improve the situation, and make it easier to replace the legacy systems when we're ready?
Immediately we can clean things up by introducing some form of abstraction layer, ideally we should be scoping several pint-sized services to replace individual capabilities. However this can be cumbersome to design and troublesome to maintain, which is where GraphQL comes into its own.

GraphQL is the subject of a lot of buzz which can make it hard to select it on objective terms, however there are a few elements of its design which make it incredibly good at addressing the extract project use-case.

- GraphQL can perform queries across multiple backend systems, and can resolve and join this data together. This is especially handy when bridging multiple data sources (e.g. a monolith depending on many external APIs, or an ancient Service-Oriented-Architecture which has complex dependencies)
- GraphQL data is defined as a view layer, meaning that important and common data transformations are performed once centrally which improves the consistency of data.
- GraphQL consumers specify both which data they require, and how it will be returned to them.
- GraphQL consumers are able to type their data and so can implement rich error handling _without_ needing to understand every detail of the legacy systems.

There are some drawbacks to implementing GraphQL in this way: It requires a good understanding of the business domain when initially modelling as it's frustrating to make major changes to the schema. In addition, it is a single point of failure to potentially more redundant systems — but all this aside, **it is a fantastic starting point because all of these problems can be solved later**.

![new-but-less-messy](/pictures/20200119/new-but-less-messy.png)

_This is a model which we implemented last year in FT Specialist to beginning a lengthy migration away from an estate of legacy monoliths which allowed us to innovate elsewhere in our technology stack. If you're interested in solving these sorts of problems, [the FT is hiring in both London and Sofia](https://roles.ft.com/)_.
