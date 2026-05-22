# validate-feed

Validates an Atom/RSS feed using a vendored copy of the W3C feedvalidator (pinned via git submodule at `vendor/feedvalidator`). The action installs the validator's Python dependencies, then runs `entrypoint.py`, which uses the library directly and emits a workflow summary, annotations, and step outputs.

The submodule pin gives reproducible validation: bumping it is a single SHA change with the diff visible against upstream. Forks consuming the action need `submodules: true` on their `actions/checkout`.

## Inputs

| Name | Default | Notes |
|---|---|---|
| `feed` | (required) | Path or URL of the feed. Local paths are resolved relative to the workspace; URLs are fetched live. |
| `origin-url` | — | Local-file mode only. Tells the validator to treat the file as if loaded from this URL, so origin/self-link checks pass for an artefact that hasn't been deployed yet. Ignored when `feed` is a URL. |
| `python-version` | `3.x` | Override if a future Python rev breaks the validator. |
| `fail-on` | `errors` | `errors` (any validator error), `warnings` (any warning or error), or `never` (run for reporting only). |
| `compatibility` | `AA` | Validator strictness: `A` (loosest), `AA` (mimics the online validator), or `AAA` (experimental — upstream warns rules may change). |

## Outputs

| Name | Notes |
|---|---|
| `errors` | Number of errors reported. |
| `warnings` | Number of warnings reported. |
| `issues` | Total reported issues including informational events. |
| `report-path` | Path to the captured report text file. Useful for `actions/upload-artifact`. |

## Examples

A built feed from an earlier CI step, validated against the URL it will be served from:

```yaml
- uses: actions/checkout@v5
  with:
    submodules: true
- uses: ./.github/actions/validate-feed
  with:
    feed: public/feed.xml
    origin-url: https://example.com/feed.xml
```

A live feed, reporting only:

```yaml
- id: feed
  uses: ./.github/actions/validate-feed
  with:
    feed: https://example.com/feed.xml
    fail-on: never
- uses: actions/upload-artifact@v5
  with:
    name: feed-validator-report
    path: ${{ steps.feed.outputs.report-path }}
```

## Development

Set up a virtualenv and run the contract tests:

```sh
python3.12 -m venv .venv
.venv/bin/pip install -r vendor/feedvalidator/requirements.txt pytest
.venv/bin/pytest tests/
```

The tests cover both the validator contract (valid fixtures → no errors; invalid fixtures → errors) and the exit-code semantics of `fail-on`. They lock in the upstream behaviour we depend on; a submodule bump that changes classification should break a test before it breaks CI.

## Bumping the vendored validator

```sh
git -C .github/actions/validate-feed/vendor/feedvalidator fetch
git -C .github/actions/validate-feed/vendor/feedvalidator checkout <new-sha>
.venv/bin/pytest tests/   # verify contract still holds
git add .github/actions/validate-feed/vendor/feedvalidator
```
