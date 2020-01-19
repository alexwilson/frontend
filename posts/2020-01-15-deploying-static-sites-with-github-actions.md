---
layout: post
title: "Deploying static sites with Github Actions"
date: 2020-01-15
author: alex
tags: ['devops', 'static-site', 'github', 'release-engineering']
---

First, some background:

Github Pages is a brilliant way to build static websites quickly and easily. However it is quite
limited as it only runs Jekyll, which is in safe mode — meaning only template customisations were
possible.  Last year after growing frustrated with hacking together template-driven functionality
like RSS feeds and article recommendations, I replatformed to Gatsby.

Porting was relatively straightforward and has brought a swathe of benefits including pluggable APIs
and the ability to write unit tests, but it also introduced a new problem: I didn't have a way of
deploying the site.

Exploring my options, pairing Github Actions (to build) with Github Pages (to host) seemed rather
attractive as:

- Actions have tight integration with Github allowing me to keep my workflows in one place. Other
    CI/CD offerings added extra overhead.
- Actions seemed customisable enough to implement Github Pages again with minimal overhead.
- If anything happens to Actions or Pages, both are simple enough that migrating to something else
    is realistic.

These all proved to be true, and I was able to quickly put together something quite usable.
A few months of small tweaks and one refactor later, I am happy enough to talk about what I did.

## Building a workflow in Github Actions

Github Actions is still relatively new so there's not a lot of documentation out there.

In order to start with writing a Github Actions script, there are three things we need to know.
1. What it is called, with the `name` key.
2. When to run this action, with the `on` key.
3. What it will do, with the `jobs` key.

Starting with the simplest, the name, I called my workflow "Build, Test and Deploy".

```yaml
name: Build, Test and Deploy
```

Next, I wanted this to run for all branches.  An important note is that **Github Actions will not
trigger for pushes that it performs**, so while I have excluded the `gh-pages` branch here, this
was more for readability than to prevent unexpected behaviour.

```yaml
on:
  push:
    branches:
      - '!gh-pages'
      - '*'
```

Lastly, we can start defining some jobs. Each has a unique ID which is also its key in the jobs block,
and a `name` key which is used the UI.

I kept this simple, and required each step to wait for the previous one to succeed with the `needs` key.
We can choose a task-runner using the `runs-on` key, I opted for `ubuntu-latest` for simplicity.

```yaml
jobs:
  build:
    name: Build
    runs-on: ubuntu-latest
  test:
    name: Test
    runs-on: ubuntu-latest
    needs: build
  deploy:
    name: Deploy
    runs-on: ubuntu-latest
    needs: deploy
```

Putting this all together, we now have a skeletion workflow which we can customise to our needs. Here
I've also added a checkout step to the `build` job.

```yaml
name: Build, Test and Deploy
on:
  push:
    branches:
      - '!gh-pages'
      - '*'
jobs:
  build:
    name: Build
    runs-on: ubuntu-latest
    steps:
    - name: Checkout Code
      uses: actions/checkout@master
  test:
    name: Test
    runs-on: ubuntu-latest
    needs: build
  deploy:
    name: Deploy
    runs-on: ubuntu-latest
    needs: deploy
```

## Building

Focussing specifically on the `build` job, we can now add a few steps to perform the
build process, so that we can later on test it and deploy it.
Our input is our source-code and our output is a build artifact.

I've commented inline.

```yaml
  build:
    name: Build
    runs-on: ubuntu-latest
    steps:

    # Firstly, let's check-out our code.
    - name: Checkout Code
      uses: actions/checkout@master

    # Now let's configure this environment to support NodeJS tooling.
    - uses: actions/setup-node@master

    # Now run an npm install...
    - name: Install Dependencies
      run: npm install

    # Run the build-script, which is a package.json script in this case.
    - name: Build
      run: npm run build
      env:
        CI: true # This is done to prevent output being too verbose.

    # Use Github's upload-artifact action to upload our hopefully-successful build!
    # We only want the `public` folder here which contains our (optimised) static site.
    - name: Save Build Artifact
      uses: actions/upload-artifact@v1
      with:
        name: site-artifact # A unique key (and name) for the artifact in question.
        path: public        # This is what we'd like to keep, we want `public` but any file/folder works.
```
Awesome! Now we have a workflow which builds and saves an artifact, which is actually downloadable
from the Github UI.

## Testing

Now that the site is being built, let's add a few steps to the test workflow to run some tests.
Our input is our source code, our build artifact. We don't return anything, but we do throw an error
if any tests fail.

```yaml
  test:
    name: Test
    needs: build
    runs-on: ubuntu-latest
    steps:

    # Again, we check-out our code.
    # This is needed as we will be executing tests which are outside of the artifact.
    - name: Checkout
      uses: actions/checkout@master

    # Next up, we download the pre-built artifact.
    - name: Download Website Artifact
      uses: actions/download-artifact@v1
      with:
        name: site-artifact # We reference the original artifact name.
        path: public        # and instruct that the artifact is restored to the `public` folder.

    # Configure node and reinstall dependencies (each task has a unique workspace!)
    - uses: actions/setup-node@master
    - name: Install Dependencies
      run: npm install

    # Finally run our tests. The output can be tweaked so Github Actions better understands it.
    - name: Run Tests
      run: npm test
```

This can absolutely be done inside the build step to save time — I kept them separate to enable
adding end-to-end tests and a few other tools which are irrelevant to the actual build process.

## Deploying

Now that we've built and tested an artifact, we're finally ready to deploy it. This time things are
a little bit trickier, and we're going to break out into a custom action.

```yaml
  # Deploy to Github Pages environment
  deploy-production:
    name: Deploy to Production
    needs: test
    runs-on: ubuntu-latest

    # I've added this extra step, so that this task *only* runs on the master branch.
    # This syntax is quite expressive and allows for much richer conditions.
    if: github.ref == 'refs/heads/master'
    steps:

    # Again we check-out.  This time as we'll be referencing a custom action!
    - name: Checkout
      uses: actions/checkout@master

    # And again, we download the website artifact. This time so we can deploy it!
    - name: Download Website Artifact
      uses: actions/download-artifact@v1
      with:
        name: site-artifact
        path: public

    # A custom action!  I'll explain a bit more about this below.
    - name: Deploy to Github Pages
      uses: ./.github/actions/github-pages/
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      with:
        args: public
```

So now let's look at how we can push to the Github Pages branch of this current repository

This operation takes place primarily in Git, and luckily we have enough information available to us
to be able to find and push to Github's HTTP Git endpoint. As we're deploying an artifact each time
we don't have access to the existing Git history, so let's go ahead and create a new repository and
push it every time.

```bash
#!/bin/sh
set -e

# Here we take an argument to choose which folder we release.
cd $*

echo "Deploying ${GITHUB_SHA} to GitHub Pages"
REPOSITORY="https://x-access-token:${GITHUB_TOKEN}@github.com/${GITHUB_REPOSITORY}.git"

## Create a new repository and reference this one, with an HTTP token.
git init
git remote add origin $REPOSITORY

## Checkout the gh-pgaes branch, and reset to the latest version.
git checkout -b gh-pages

## Configure Git to perform the commit as the user who triggered this action.
## If the build wasn't triggered by a human this will be the person who last committed to the branch
git config user.name "${GITHUB_ACTOR}"
git config user.email "${GITHUB_ACTOR}@users.noreply.github.com"

## Finally, add the contents of our script
git add .
git commit -m "Deploying ${GITHUB_SHA} to Github Pages"

## And force push to the gh-pages branch so Github Pages can serve it!
git push --force origin gh-pages:gh-pages
rm -fr .git
cd $GITHUB_WORKSPACE

echo "Successfully deployed."
```

Lastly, to be able to use this custom shell script we wrap it in a basic Dockerfile including Git
and minimal boilerplate to make it usable as a custom action.

```Dockerfile
# We use the alpine git image as it's the smallest for what we need.
FROM alpine/git:latest

# Github actions use a few Docker labels for interacting with custom actions.
LABEL "maintainer"="Alex Wilson <alex@alexwilson.tech>"
LABEL "com.github.actions.name"="GitHub Pages Deploy"
LABEL "com.github.actions.description"="Deploy to GitHub Pages."
LABEL "com.github.actions.icon"="upload-cloud"
LABEL "com.github.actions.color"="blue"

# The most important bit other than the parent image is this: We add the below script
# to actually do the Github Pages deploy step and make it the entrypoint.
ADD entrypoint.sh /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
```


## Deploying - Letting Github Pages know

Well, unfortunately that wasn't enough.  Even though we've pushed to the `gh-pages` branch, Github
won't do anything because we _pushed_ this using Github Actions.  Remember that I said that Actions
won't trigger itself to prevent a circular dependency?  Well this is _that_ protection in action.

Thankfully, we can mitigate this by using the Github Pages API.  We use it to queue another a Pages
build as our final deploy step.

```yaml
    - name: Trigger a Pages Update
      run: |
        curl -sS -X POST -H "Authorization: Bearer ${{ secrets.GITHUB_PAGES_DEPLOY_TOKEN }}" \
        https://api.github.com/repos/${{ github.repository }}/pages/builds \
```

There is a new prerequisite - we now need to add the `GITHUB_PAGES_DEPLOY_TOKEN` environment variable,
with a new Personal Access Token which has Repository scopes.

## Optimising the whole thing

You may have noticed that we're repeatedly reinstalling dependencies which is a little bit wasteful.
Thankfully, as well as artifact support, Github Actions also offer us a caching mechanism which we can
to speed this up.

It's important to mention that Github only keeps the cache alive for a maximum of 7 days since the last
build, but if you build at least a week this won't be an issue.

```yaml
    - uses: actions/setup-node@master

    # Store NPM's global cache, using the package-lock.json our cache key.
    - name: Restore NPM Cache
      uses: actions/cache@v1
      id: cache-npm
      with:
        path: ~/.npm
        key: npm-${{ hashFiles('**/package-lock.json') }}

    # And the same for node_modules, using the package-lock.json our cache key.
    - name: Restore node_modules
      uses: actions/cache@v1
      id: cache-node_modules
      with:
        path: node_modules
        key: node_modules-${{ hashFiles('**/package-lock.json') }}
```

We're also able to tweak the `checkout` step to speed it up a bit, by adding the shallow clone directive.
After-all, we are not interacting with the project history here — we're only building it.

```yaml
    - name: Checkout
      uses: actions/checkout@master
      with:
        fetch-depth: 1
```

## Adding history and rollbacks
A nice benefit of using this workflow on Github Pages is that we're also creating an artifact ins Git
itself which makes rolling back a standard git operation, something like this:

```bash{promptUser: alex}
git fetch origin
git checkout -t origin/gh-pages
git reset <commit-id>
git push gh-pages --force
```

One problem: We currently overwrite our history so we can't revert.

To try and rememdy this I made a small adjustment:

```bash
## We still checkout the gh-pages branch
git checkout -b gh-pages

# But this time, we fetch the existing one
git fetch origin gh-pages

# And soft reset to its latest commit to avoid any conflicts.
git reset --soft origin/gh-pages
```

## Wrapping up

This workflow has been fantastic for me and I've been able to focus on making site adjustments
without constantly having to repair a build process.

As well as Actions I have now added a few bots, a scheduled build (to detect problems) and Slack
notifications, all of which let me keep up-to-date with the fast-moving world of node dependencies
without incurring side-project fatigue.

You can see the entire project here
