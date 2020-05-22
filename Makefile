gh-pages-rebuild:
	@curl https://api.github.com/repos/${GITHUB_REPOSITORY}/pages/builds \
		-u "${GITHUB_USERNAME}:${GITHUB_PAGES_DEPLOY_TOKEN}" \
		-X POST
