FROM alpine/git:latest

LABEL "maintainer"="Alex Wilson <alex@alexwilson.tech>"
LABEL "com.github.actions.name"="GitHub Pages Deploy"
LABEL "com.github.actions.description"="Deploy to GitHub Pages."
LABEL "com.github.actions.icon"="upload-cloud"
LABEL "com.github.actions.color"="blue"

ADD entrypoint.sh /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
