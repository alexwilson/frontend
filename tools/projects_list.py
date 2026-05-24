#!/usr/bin/env python3
"""List monorepo projects, optionally narrowed by --since or --filter."""
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Callable, Iterable

EMPTY_REFS = {"", "0" * 40}


@dataclass(frozen=True)
class Project:
    name: str
    path: str


@dataclass(frozen=True)
class Context:
    root: Path
    since: str | None
    filters: tuple[str, ...]


Source = Callable[[Context], list[Project]]


def repo_root() -> Path:
    out = subprocess.run(
        ["git", "rev-parse", "--show-toplevel"],
        check=True, capture_output=True, text=True,
    )
    return Path(out.stdout.strip())


def pnpm_list(root: Path, *filters: str) -> list[Project]:
    args = ["pnpm", "-r"]
    for f in filters:
        args += ["--filter", f]
    args += ["list", "--depth", "-1", "--json"]

    proc = subprocess.run(args, cwd=root, capture_output=True, text=True)
    if proc.returncode != 0:
        raise RuntimeError(
            f"pnpm exited {proc.returncode}: {proc.stderr.strip() or '(no stderr)'}"
        )
    raw = json.loads(proc.stdout or "[]")
    return [
        Project(name=p["name"], path=str(Path(p["path"]).relative_to(root)))
        for p in raw
        if p.get("name") != "root"
    ]


def js_source(ctx: Context) -> list[Project]:
    """Pnpm source; falls back to all packages when --since narrows to empty."""
    filters: list[str] = []
    since_only = False

    if ctx.since and ctx.since not in EMPTY_REFS:
        filters.append(f"[{ctx.since}]...")
        since_only = not ctx.filters

    filters.extend(ctx.filters)

    try:
        projects = pnpm_list(ctx.root, *filters)
    except RuntimeError as err:
        if not since_only:
            raise
        print(
            f"::warning::pnpm '[{ctx.since}]...' filter errored ({err}); "
            "falling back to all JS packages.",
            file=sys.stderr,
        )
        return pnpm_list(ctx.root)

    if since_only and not projects:
        print(f"No changes since {ctx.since}; including all JS packages.", file=sys.stderr)
        return pnpm_list(ctx.root)

    return projects


SOURCES: tuple[Source, ...] = (js_source,)


def dedupe_sort(projects: Iterable[Project]) -> list[Project]:
    seen: dict[str, Project] = {}
    for p in projects:
        seen.setdefault(p.name, p)
    return sorted(seen.values(), key=lambda p: p.path)


def emit_json(projects: list[Project]) -> None:
    json.dump([p.__dict__ for p in projects], sys.stdout, separators=(",", ":"))
    sys.stdout.write("\n")


def emit_table(projects: list[Project]) -> None:
    name_w = max((len(p.name) for p in projects), default=0)
    name_w = max(name_w, len("NAME"))
    bold, reset = ("\033[1m", "\033[0m") if sys.stdout.isatty() else ("", "")
    print(f"{bold}{'NAME':<{name_w}}  PATH{reset}")
    for p in projects:
        print(f"{p.name:<{name_w}}  {p.path}")


def _nonempty(value: str) -> str:
    if not value:
        raise argparse.ArgumentTypeError("must not be empty")
    return value


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        prog="list-projects",
        description="List workspace projects, optionally narrowed by --since or --filter.",
    )
    parser.add_argument("--json", action="store_true",
                        help="Emit a JSON array of {name, path}.")
    parser.add_argument("--since", metavar="REF", type=_nonempty,
                        help="Narrow to projects changed since REF + their dependents.")
    parser.add_argument("--filter", dest="filters", action="append", default=[],
                        metavar="EXPR", type=_nonempty,
                        help="Narrow using a pnpm filter expression. Repeatable.")
    return parser.parse_args(argv)


def main(argv: list[str]) -> int:
    args = parse_args(argv)
    root = repo_root()
    os.chdir(root)
    ctx = Context(root=root, since=args.since, filters=tuple(args.filters))

    try:
        merged: list[Project] = []
        for source in SOURCES:
            merged.extend(source(ctx))
    except RuntimeError as err:
        print(f"error: {err}", file=sys.stderr)
        return 1

    projects = dedupe_sort(merged)

    if args.json:
        emit_json(projects)
    else:
        emit_table(projects)

    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
