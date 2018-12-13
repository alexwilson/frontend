---
layout: post
title: "Weeknotes: ReInvent — 8th December 2018"
date: 2018-12-08 23:19
last_modified_at: 2018-12-12 20:03
author: alex
image: https://alexwilson.tech/pictures/20181208--shinjuku.jpg
image_cropped: https://alexwilson.tech/pictures/20181208--shinjuku--cropped.jpg
image_credit: Photo by Alex Wilson.
tags: ['weeknotes', 'aws', 'reinvent', 'bio', 'slack', 'nar', 'motivation']
---

Monday night I flew back to the UK. The difference between the efficiency and cleanliness of Haneda airport and Heathrow is already very stark, but it has nothing on English trains: I walked into 40m of service disruptions on the London Underground! Groan.

- We shot a short 30 second bumper video [recapping NAR product development work in 2018](https://www.youtube.com/watch?v=6r0wBPYDHJ8). Reflecting on it's been an interesting year, full of lots of interesting challenges and I'm really proud of everything we have accomplished and achieved.

#### Tackling Di-Slack-tions
In an ongoing effort to try and improve my focus and presence I have experimentally set Slack to keep me in do-not-disturb.  My hypothesis is that the majority of Slack notifications I currently receive are not time sensitive, and that giving users the ability to choose when they want my attention (via the Do-Not-Disturb override) will make me more useful.
- I took this particular action after receiving some feedback that in many meetings it looks like I’m not paying full attention: This isn’t wholly inaccurate.  I actively filter out distractions as much as possible, such as emails and instant messages, however give Slack a wide berth as it’s normally relevant: But this is a rabbit-hole and sometimes it’s easy to stop paying attention in favour of responding to unimportant Slack messages.
- Over time I have also been acutely aware that sometimes I may receive a notification, open Slack to clear the notification and then passively read the message—later forgetting that one has been sent, resulting in missing important [but less time sensitive] messages!
- To measure success, I’m planning on measuring the volume of Slack messages I send as well as asking people informally if they feel like this has helped.
- Since Slack enforce a limit that you can’t be in do-not-disturb for longer than a year I have also put together a small Lambda function to periodically cycle through all of my workspaces every week and keep extending my do-not-disturb.

### AWS reInvent
AWS reInvent took place last week, and they released _a lot_ of stuff. Too much stuff to really go over, so after catching up with the event, here are a few of my favourites:

- [Amazon Timestream](https://aws.amazon.com/timestream/) — Two weeks ago I was looking for an AWS-hostable time series DB. Amazon now have one. Where did you put the cameras, Amazon??
- [AWS LakeFormation](https://aws.amazon.com/lake-formation/) — Describe and form an entire AWS-based data lake easily: Raw data is preprocessed, classified and stored at rest in S3 so that it can be easily used and queried by other tools. This is interesting because it allows you to focus on building a very performant data pipeline.
- [Amazon Managed Streaming for Kafka](https://aws.amazon.com/about-aws/whats-new/2018/11/introducing-amazon-managed-streaming-for-kafka-in-public-preview/) — The specifics here will be very interesting, it's a bold move for Amazon to bring this as it makes the differentiation between Kafka and Kinesis a little trickier. So I suppose Kinesis is better here for AWS-native streaming and reacting to events using something like Lambda, whereas Kafka makes use-cases where having the stream also be a datastore (say, you're doing event-sourcing). Pricing also looks to be quite competitive with Aiven and Heroku.
- [Amazon Quantum Ledger Database](https://aws.amazon.com/about-aws/whats-new/2018/11/introducing-amazon-qldb/)—Yes, yes, Amazon also announced a blockchain-like product but actually that's not that important to me: For me one of the most interesting features of the Blockchain is the concept of an immutable ledger (ignoring some blockchain problems such as forks), and Amazon are now offering a database product which is, just that: An immutable ledger. But with no operational or scaling problems to solve and much more productive developer tooling (building UIs based on Ethereum is _not_ fun!): It's a real database.
- [Amazon Textract](https://aws.amazon.com/textract/) — So as someone with a massive amount of data between Dropbox, Evernote and a couple of scanners/cameras, I'd really like to start extracting my content in order to go fully paperless. I haven't tried this yet, and I'm sure there was another service in AWS doing this perviously, so very keen to give this a go.
- [AWS Control Tower](https://aws.amazon.com/controltower/) — AWS organisation-wide governance tooling! I can only imagine how large some of the larger organisations using AWS are starting to become, and so tooling like this is going to be very well recieved indeed.
- [AWS Security Hub](https://aws.amazon.com/security-hub/) — 
- [AWS Outposts](https://aws.amazon.com/outposts/) — For anyone doing on-prem this is going to open up many doors! The short-version is that this allows running physical centres using AWS cloud governance tooling.
- [AWS App Mesh](https://aws.amazon.com/about-aws/whats-new/2018/11/introducing-aws-app-mesh---service-mesh-for-microservices-on-aws/) — The press-release suggests that this is mostly hosted [Envoy](https://www.envoyproxy.io). Good to see Amazon running more popular CNCF software, and integrating with the wider Kubernetes stack. At this rate, Prometheus in 2019? 😄
- [AWS Cloud Map](https://aws.amazon.com/about-aws/whats-new/2018/11/introducing-aws-cloud-map/)
- API Gateway WebSockets — Awesome! Can we have EventSources next please? :)
- [S3 INT](https://aws.amazon.com/about-aws/whats-new/2018/11/s3-intelligent-tiering/) — S3 Intelligent Tiering. You turn this on, and it reduces the availability of less frequently accessed objects (of course they are still accessible).  Very keen to see how this performs in production: A common pattern for me is to keep hundreds of thousands of images in an S3 bucket, however given the behaviour patterns of news websites, normally an image is only frequently accessed for the first couple of weeks after an article has been published and so Intelligent Tiering will still allow old images to be accessed but at a great cost-saving.
- [S3 Batch Operations](https://aws.amazon.com/about-aws/whats-new/2018/11/s3-batch-operations/) — This is one which has hit me a couple of times. [In-fact, enough that I wrote about it](https://alexwilson.tech/blog/2017/11/30/updating-permissions-in-large-s3-buckets/).  Managing metadata en-masse in S3 is an absolute nightmare, although it seems that now there is going to be functionality to do this properly, although going by the press-release this might be a UI-only thing in which case I'd still have a problem. _(BTW it took me 3 hours in Golang, not 3 months!)_
- [Firecracker](https://firecracker-microvm.github.io) — Amazon have open-sourced their new container run-time in-use for AWS Lambda and other areas of their service.  This is not the only such effort going on right now, Fastly and Cloudflare (amongst many others) are doing this sort of work in improving runtimes to help solve the new scaling and performance problems of today, which are starting to crop up as function-as-a-service architecture grows in popularity.
- [Lambda via ALB](https://aws.amazon.com/about-aws/whats-new/2018/11/alb-can-now-invoke-lambda-functions-to-serve-https-requests/) — This is a very big deal, and I am surprised I haven't heard more noise about it! Lambda@Edge is too slow and limited to really recognise the benefits of edge computing in the AWS cloud, but, now, making full applications directly routable via application load balancers means that it is possible to build your _entire presentation tier_ directly with Lambda. Now that is seriously cool.

I am also particularly interested in some of the developments around AppSync: GraphQL is my preferred strategy of choice for interacting with tricky (read: legacy, chattery or clunky) system APIs. Starting today Apollo is still the technology I would pick (especially as it works well within AWS Lambda), but given time I can see AppSync being a fantastic tool for traversing multiple APIs for consumption by a simple (ALB-to-Lambda?) presentation tier.

[More here](https://serverless.com/blog/reinvent-2018-serverless-announcements/)

---

- GDS is doing a lot of hiring around Birmingham! And all for good stuff! If you're around the West Midlands, and are looking for a change of scene, [defo recommend checking them out](https://jobs.jobvite.com/justicedigitalandtechnology/jobs). GDS is [meaningful] digital transformation done right.
- Wikipedia’s donations campaing is here now, and its ads are getting more and more annoying, and now follow you around the page. [Here's how the community approached campaigns 10 years ago](https://en.wikipedia.org/wiki/Wikipedia:Fundraising_redesign), big difference from the less transparent presumably more data-driven state of today. (Wow, Wikipedia has been around for an incredibly long time!)
- [Subprime Code](https://ftalphaville.ft.com/2018/10/22/1540184400000/Subprime-code--a-very-avoidable-crisis/): There is a collective mountain of technical debt being built up. If you thought the subprime mortgage crisis in 2008 was bad, this one is going to be the end of us all. Y2K is back.