gh-pages-rebuild:
	@curl https://api.github.com/repos/antoligy/personal-website/pages/builds \
		-H "Accept: application/vnd.github.mister-fantastic-preview+json" \
		-u "${GITHUB_USERNAME}:${GITHUB_ACCESS_TOKEN}" \
		-X POST
