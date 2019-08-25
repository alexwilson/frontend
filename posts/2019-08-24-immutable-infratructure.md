---
layout: post
title: "Explainer: Immutable Infrastructure"
date: 2019-08-24
author: alex
tags: ['explainer', 'devops', 'immutable-infrastructure', 'infrastructure-as-code']
---

Over the years we have introduced ever-more creative ways to run our software. Hand-crafted servers became configuration managed. Then VMs rolled along. The VMs became auto-scalable, and in time, started running scores of containers[^1].

Today most modern software being deployed to the web is likely to run in a container of some sort.

We got here by continually optimising to balance ever-growing complexity in our technology against problems emerging when us pesky humans try to use, operate and adapt our technology.
By using code to describe as much as we can about how we expect our applications to run, we’re able to make some of the same assumptions we do about our software
i.e. _Under known conditions our product will meet its requirements_.

As it is readable and repeatable by a computer, we are able to prove this assumption using software testing methodologies. This is referred to as Infrastructure as Code[^2].

To understand mutability as a property of systems, it's easier to first understand what **Mutable Infrastructure** is.  Mutable infrastructure may be changed (_mutated_), and many of our personal computers are like this.  When installing software or changing some settings, our computer is updated in-place and we don't notice a difference.  This is how a lot of IT has traditionally been run, where every change takes effect immediately.

The primary disadvantage of this approach is that it requires us to know _exactly_ what to change and over time, our confidence that this will be successful naturally decreases.  When releasing 10+ versions of a piece of software in a week (or, for example, applying security patches) the system drifts further and further away from where it was when we first created it, which is the last time we were mostly sure about what it looked like.  When dealing with many systems (e.g. I am serving 100+ customers per hour and need a few computers to handle the load) this becomes incredibly hard to manage.

**Immutable Infrastructure** is _entirely_ unchanging: Resources (e.g. Containers) may not be changed, and so whenever a change needs to be made — no matter how big or small — they are completely replaced instead of being modified or updated. This can be incredibly complex to manage as it may require running multiple versions of an application at the same time which has implications on data integrity.
The end-result is that every release will leave the system, or systems, in exactly the expected (and tested) state which theoretically reduces the amount of unknowns. It makes it easier to manage many systems, as whenever something goes wrong, we can either roll-back or replace individual systems with new ones.

I'll talk about some of the disadvantages of this approach in a separate post.

[^1]: **Containers** are a basic unit of cloud-computing. A container is a portion of a virtual computer and many can be deployed onto one computer at a time. Companies like Amazon and Google sell the capability to run many containers at a time so that you don't have to. [Docker](https://www.docker.com) is a popular containerising tool.
[^2]: **Infrastructure as Code** (IaC) describes our ability to specify our desired resources and their state in code. [Terraform](https://www.terraform.io) and [Ansible](https://www.ansible.com) are frequently used to achieve this.
