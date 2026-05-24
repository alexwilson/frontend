#!/usr/bin/env python3
"""
Lint monorepo project structure. Reports projects missing required components.

Today's rules:
  - Every directory in services/* must contain service.toml.
  - Every directory in components/* must contain package.json.

Output:
  Default — silent on success; on failure, one line per issue. Red `✗` on TTY.
  --json  — JSON array of {path, message}. Always emits (empty array if clean).

Exit code: 0 if no issues; 1 if any.

Invoked via `mise run projects:lint`. See doc/design/monorepo-tooling.md.

Pluggable: each rule is a Context -> list[Issue] function. Add to RULES.
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Callable


@dataclass(frozen=True)
class Issue:
    path: str      # relative to repo root, e.g. "services/cms"
    message: str   # human-readable description


@dataclass(frozen=True)
class Context:
    root: Path


Rule = Callable[[Context], list[Issue]]


def repo_root() -> Path:
    out = subprocess.run(
        ["git", "rev-parse", "--show-toplevel"],
        check=True, capture_output=True, text=True,
    )
    return Path(out.stdout.strip())


def _children_missing_file(
    ctx: Context, subdir: str, required: str, message: str,
) -> list[Issue]:
    """Helper: every direct child directory of <root>/<subdir>/ must contain
    <required> at its top level. Stray files at the subdir level are ignored."""
    issues: list[Issue] = []
    parent = ctx.root / subdir
    if not parent.is_dir():
        return issues
    for child in sorted(parent.iterdir()):
        if not child.is_dir():
            continue
        if (child / required).exists():
            continue
        issues.append(Issue(
            path=str(child.relative_to(ctx.root)),
            message=message,
        ))
    return issues


# --- rules -----------------------------------------------------------------

def services_have_service_toml(ctx: Context) -> list[Issue]:
    return _children_missing_file(ctx, "services", "service.toml", "missing service.toml")


def components_have_package_json(ctx: Context) -> list[Issue]:
    return _children_missing_file(ctx, "components", "package.json", "missing package.json")


# To add a rule: write a Context -> list[Issue] function and append it to RULES.
RULES: tuple[Rule, ...] = (
    services_have_service_toml,
    components_have_package_json,
)


# --- formatters ------------------------------------------------------------

def emit_text(issues: list[Issue], file=None) -> None:
    if file is None:
        file = sys.stdout
    if not issues:
        return
    is_tty = file.isatty()
    red = "\033[31m" if is_tty else ""
    reset = "\033[0m" if is_tty else ""
    for issue in issues:
        print(f"{red}✗{reset} {issue.path}: {issue.message}", file=file)


def emit_json(issues: list[Issue], file=None) -> None:
    if file is None:
        file = sys.stdout
    json.dump([asdict(i) for i in issues], file, separators=(",", ":"))
    file.write("\n")


# --- CLI -------------------------------------------------------------------

def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        prog="projects-lint",
        description="Lint monorepo project structure.",
    )
    parser.add_argument(
        "--json", action="store_true",
        help="Emit issues as a JSON array (always — empty array if clean).",
    )
    return parser.parse_args(argv)


def main(argv: list[str]) -> int:
    args = parse_args(argv)
    root = repo_root()
    ctx = Context(root=root)

    issues: list[Issue] = []
    for rule in RULES:
        issues.extend(rule(ctx))
    issues.sort(key=lambda i: (i.path, i.message))

    if args.json:
        emit_json(issues)
    else:
        emit_text(issues)

    return 1 if issues else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
