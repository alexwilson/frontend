# validate-feed

Runs the W3C feed validator (`w3c/feedvalidator`) against an Atom/RSS feed in CI. It clones the validator into a temp dir, installs its Python deps, then runs `demo.py` against whatever feed you point it at: a local file or a live URL.

## Inputs

| Name | Default | Notes |
|---|---|---|
| `feed` | (required) | Path or URL of the feed. |
| `rewrite-url` | — | Local-file mode only. The validator complains if the feed's self-link doesn't match where it was loaded from, so we rewrite it to `feedvalidator.org`. Ignored when `feed` is a URL. |
| `python-version` | `3.x` | Override if a future Python rev breaks the validator. |

## Examples

A built feed from an earlier CI step:

```yaml
- uses: ./.github/actions/validate-feed
  with:
    feed: public/feed.xml
    rewrite-url: https://example.com/feed.xml
```

A live feed:

```yaml
- uses: ./.github/actions/validate-feed
  with:
    feed: https://example.com/feed.xml
```

## Known gotchas

The action clones `w3c/feedvalidator` at `main`. Upstream changes can affect your results without any change on your side; pin a fork if that becomes a problem.
