#!/bin/sh
set -e

cd "$PUBLISH_DIR"

echo "Deploying ${GITHUB_SHA} to GitHub Pages"
echo "Initialising in ${PWD} as ${GITHUB_ACTOR}"

git init
git config set advice.defaultBranchName false
git config user.name "${GITHUB_ACTOR}"
git config user.email "${GITHUB_ACTOR}@users.noreply.github.com"
git remote add origin "https://x-access-token:${GITHUB_TOKEN}@github.com/${GITHUB_REPOSITORY}.git"

git checkout -b gh-pages
git fetch origin gh-pages
git reset --soft origin/gh-pages
git add .
git commit -m "Deploying ${GITHUB_SHA} to GitHub Pages"
git push --force origin gh-pages:gh-pages

rm -fr .git
echo "Successfully deployed."
