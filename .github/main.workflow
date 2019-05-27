workflow "Build and Deploy" {
  on = "push"
  resolves = ["Deploy"]
}

action "Filter Master Branch" {
  needs = "Test"
  uses = "actions/bin/filter@master"
  args = "branch master"
}

action "Install" {
  uses = "actions/npm@master"
  args = "install"
}

action "Build" {
  needs = "Install"
  uses = "actions/npm@master"
  args = "run build"
}

action "Deploy" {
  needs = "Build"
  uses = "./.github/actions/github-pages/"
  secrets = ["GITHUB_TOKEN"]
  args = "public"
}

action "Test" {
  uses = "actions/npm@master"
  args = "test"
}
