#!/bin/sh
set -e

cd $*

echo "Deploying ${GITHUB_SHA} to GitHub Pages"
REPOSITORY="https://x-access-token:${GITHUB_TOKEN}@github.com/${GITHUB_REPOSITORY}.git"

git init
git remote add origin $REPOSITORY
git checkout -b gh-pages
git fetch origin gh-pages
git reset --soft origin/gh-pages
git config user.name "${GITHUB_ACTOR}"
git config user.email "${GITHUB_ACTOR}@users.noreply.github.com"
git add .
git commit -m "Deploying ${GITHUB_SHA} to Github Pages"
git push --force origin gh-pages:gh-pages
rm -fr .git
cd $GITHUB_WORKSPACE

echo "Successfully deployed."
