---
layout: post
title: Changing object permissions in large S3 buckets
date: 2017-11-30 20:44
tags: [aws]
author: alex
---

Of all of the services Amazon Web Services pushes, S3 (Simple Storage Service) is maybe the most versatile and well-known: It “just works” and is a fantastic service for many use-cases.
It turns out though that you can have too much of a good thing as many have learned [including Amazon](https://www.theregister.co.uk/2017/03/01/aws_s3_outage/), and recently I have run into a reminder that S3’s API still leaves a little to be desired.

## The problem
My use-case was pretty simple.  I had a bucket with about 2.5 million objects and needed to update the ACL on these objects to make them publicly readable.  Simple enough ... right?

Usually I would approach such a task by changing the bucket policies to apply to all objects regardless of their own ACLs, yet here I did not have the option to change the bucket policies, and even so, this would have caused problems for any systems relying upon canned Object ACLs.

## The solution
I wrote a small program in Go to recursively update S3 object permissions to any canned ACL.  It’s documented and downloadable here: [https://github.com/alexwilson/s3-recursive-acl/](https://github.com/alexwilson/s3-recursive-acl/)

I hope that this is useful as it stands, and I am keen to hear any suggestions on how I can improve the methodology (did I miss something?) as well as the program itself.

Some more notes on how I came to this conclusion, and general thoughts on S3 and Golang after the break!


---

### Attempt #1 — Read the docs
Amazon’s documentation is very comprehensive when you know where to look.  Sadly, I could not find anything that helped.  Ask around AWS practitioners and Solutions Architects the consensus was that I might need to write something custom to solve this problem.  Grr, but maybe there is something, and it's just buried deep within the docs!

The file operations beneath the `aws s3`  command line, it makes sense that there’s nothing oriented towards modifying AWS ACL in here.  I was a bit disappointed that there was nothing beneath the S3API itself, however, as recursively changing permissions (still) seems like a reasonable use-case!

I’m glad that the documentation is fairly conclusive, which is pretty refreshing given the spurious nature of documentation in competing services.  I’m hoping that a future version of the S3 API might introduce this functionality or something analogous to it!

### Attempt #2 — Try to recursively update all Object metadata
This was a bit silly.  Various StackOverflow answers for tangentially related problems suggest that something like this might work:
```bash{promptUser: alex}
aws s3 cp --metadata FOO=bar --recursive --acl public-read --profile test--prod s3://test-bucket-2/files/ s3://test-bucket-2/files/
```
It didn’t as no metadata was being changed.  It could have been an ideal approach as no API calls would need to be made from my machine for this operation to complete.

### Attempt #3 — Start instrumenting the S3 API myself
`putObjectAcl` is super nice as far as API methods go.  It’s a full PUT for a given object, but only for its metadata, so all I need to know is the key and the new ACL document.

To save some time I started looking at the SDKs and quickly found the stellar work in the [Golang SDK]( https://aws.amazon.com/sdk-for-go/).
It’s got the same base functionality as other SDKs, but with nice features such as automatic pagination (which is a huge time-saver especially in AWS where pagination can be non-linear and involves keeping track of tokens) and not enforcing a particular concurrency model.

This seemed ideal as it allowed me to implement a simplistic, yet elegant, approach:

1. Iterate over pages of 1000 objects at a time, recursively listing by a given key.
2. Spin-off Goroutines to run `putObjectACL` for each child key.
3. Wait for the Goroutines to complete before exiting.

I could’ve done something nicer here such as implementing a proper worker pool pattern, however, my batch sizes and concurrency requirements aren’t yet nearly large enough to justify this.  Maybe this is a possible improvement for the future!

Goroutines were essential with this approach as it had to perform well. I effectively ran 2.5 thousand API calls to list the objects in this bucket and a further 2.5 million API calls to update those object permissions.

And it ran _beautifully_.  In just over an hour all 2.5 million objects had the correct ACL!
```bash{promptUser: alex}
AWS_PROFILE=test--profile ./s3-recursive-acl --bucket test-bucket-1 --region ap-northeast-1 --path test/
```

#### Go-tchas

Not specific to this particular project, there are a few things in Golang that will definitely throw people off which I addressed whilst writing this.

Passing pointers to Goroutines is very risky as the pointers can and will be reassigned.  _Always_ make a copy of the true value you want first.  You can convert formats within the Goroutine itself if performance is a concern (in order not to block).

```go
        for _, object := range page.Contents {
            // Make a copy of the value allocated to the pointer before we do anything with it!
            key := *object.Key
        }
```

Goroutines logically run outside of the main scope of the application, and while this means sometimes they will run concurrently in the main thread, the application will not wait for Goroutines to complete, so you can’t guarantee that your operations will even run!

Thankfully [WaitGroup](https://golang.org/pkg/sync/#WaitGroup) was added to the sync standard library to solve this problem, and it is ridiculously simple to get up and running with.

Instantiate a WaitGroup, and instruct the application to block until the WaitGroup is terminated.  For every non-blocking operation that is spun up, increment the WaitGroup counter, and then reduce it when the operations complete.  This approach works well and has virtually no footprint.

```go
func main() {

    // Create a WaitGroup
    var wg sync.WaitGroup

    go func() {

        // Ask the WaitGroup to wait.
        wg.Add(1)
        // Do some work here.

        // Tell the WaitGroup we're done
        defer wg.Done()
    }

    // Block until our tasks are done.
    wg.Wait()
}
```


### Wrap-up
I’m glad that S3 is this simple to orchestrate.  Being able to make this many Object Metadata changes this quickly (2.5 million objects in just over an hour?  That’s ~600req/s!) without being throttled is pretty spectacular. (I’m sure that running this actually within an EC2 in the same region would make this quicker)

Also: Golang is invaluable for writing these super-performant scripts.  Every time I’ve had the chance to use it to tackle a problem, I’ve found it intuitive and quick to write and run.  I hope to have more of opportunities to use it in future work.  I’m thankful that I took the time to look at other options and languages first otherwise I wouldn’t have been done so quickly!

I got a chance to try out the [Glide packaging system](https://glide.sh/) for this project, and it is really, _really_ nice.  Recommended for projects of all shapes and sizes, and I will be using it for my future Golang hacks!

[Download S3-recursive-acl here](https://github.com/alexwilson/s3-recursive-acl/)
