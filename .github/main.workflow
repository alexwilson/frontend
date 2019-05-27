workflow "Build and Deploy" {
  on = "push"
  resolves = ["Deploy"]
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

action "Only On Master" {
  needs = "Build"
  uses = "actions/bin/filter@master"
  args = "branch master"
}

action "Deploy" {
  needs = "Only On Master"
  uses = "./.github/actions/github-pages/"
  secrets = ["GITHUB_TOKEN"]
  args = "public"
}

action "Test" {
  uses = "actions/npm@master"
  args = "test"
}
