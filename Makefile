#!make

.PHONY: install build start

all: install start

install:
	bundle install
	yarn

build:
	yarn build & bundle exec jekyll build

watch:
	yarn watch & bundle exec jekyll serve --watch

start:
	yarn start & bundle exec jekyll serve -w --incremental

