#!make

.PHONY: install start

all: install start

install:
	bundle install
	yarn

build:
	yarn build & bundle exec jekyll build

start:
	yarn start & bundle exec jekyll serve -w --incremental

