#!/usr/bin/env bash
# scripts/list-projects.sh
#
# List workspace projects. With no base ref, lists every project; with a
# base git ref, narrows to projects affected by changes since that ref
# (changed packages + their dependents).
#
# Usage: list-projects.sh [--json] [base-ref]
#   Default output is a name + path column per project, sorted by path.
#   --json emits a GitHub Actions matrix:
#     {"include": [{"name": "...", "path": "..."}, ...]}
#
# Pluggable by design: each source function takes BASE_REF and prints a JSON
# array of {name, path} objects. Add a function, merge its output in main().

set -euo pipefail

ROOT=$(git rev-parse --show-toplevel)
cd "$ROOT"

JSON=0
BASE_REF=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --json) JSON=1 ;;
    --) shift; BASE_REF="${1:-}"; break ;;
    -*) echo "unknown flag: $1" >&2; exit 2 ;;
    *) BASE_REF="$1" ;;
  esac
  shift
done

is_empty_ref() {
  [[ -z "$1" || "$1" == "0000000000000000000000000000000000000000" ]]
}

# Normalise pnpm's list output ([{name, path, ...}] with absolute paths and
# a synthetic "root" entry) into our {name, path} shape with repo-relative
# paths.
normalise() {
  jq -c --arg root "$ROOT/" '
    [ .[]
      | select(.name != "root")
      | { name, path: (.path | sub("^" + $root; "")) }
    ]
  '
}

# JS / pnpm workspace source. Packages changed since base + their dependents,
# matching the previous `lerna list --since --include-dependents` behaviour.
# Empty / missing / errored base ref falls back to "all packages" — same as
# lerna's "no --since" path, since a no-change PR still needs the plumbing
# exercised.
js_affected() {
  local base="$1"
  local all_pkgs
  all_pkgs=$(pnpm -r list --depth -1 --json 2>/dev/null)

  if is_empty_ref "$base"; then
    echo "$all_pkgs" | normalise
    return
  fi

  local changed
  if ! changed=$(pnpm -r --filter "[$base]..." list --depth -1 --json 2>/dev/null); then
    echo "::warning::pnpm '[$base]...' filter failed; falling back to all JS packages." >&2
    echo "$all_pkgs" | normalise
    return
  fi

  if [[ -z "$changed" || "$changed" == "[]" ]]; then
    echo "$all_pkgs" | normalise
    return
  fi

  echo "$changed" | normalise
}

# To add a source (terraform, go, ...) write a function with the same contract
# (BASE_REF -> JSON array of {name, path}) and merge it in main() below.

main() {
  local merged
  merged=$(js_affected "$BASE_REF")

  # When adding more sources:
  #   merged=$(jq -s 'add' \
  #     <(js_affected "$BASE_REF") \
  #     <(terraform_affected "$BASE_REF"))

  if [[ $JSON -eq 1 ]]; then
    echo "$merged" | jq -c '{include: (unique_by(.name) | sort_by(.path))}'
  else
    local bold="" reset=""
    if [[ -t 1 ]]; then
      bold=$'\033[1m'
      reset=$'\033[0m'
    fi
    {
      printf 'NAME\tPATH\n'
      echo "$merged" \
        | jq -r 'unique_by(.name) | sort_by(.path) | .[] | "\(.name)\t\(.path)"'
    } | column -t -s $'\t' \
      | awk -v b="$bold" -v r="$reset" 'NR==1 {print b $0 r; next} {print}'
  fi
}

main "$@"
