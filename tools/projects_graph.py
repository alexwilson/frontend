#!/usr/bin/env python3
"""
Show monorepo project dependencies. First-order only.

Edges come from two sources:
  - build (default): package.json dependencies + devDependencies, filtered to
    workspace projects (external deps like react/gatsby are excluded).
  - runtime: each service's service.toml [runtime].depends_on. Every service
    carries a service.toml; depends_on may be empty. Declares deploy/runtime
    relationships that aren't visible to pnpm (e.g. one worker calling
    another over HTTP).

Invoked via `mise run projects:graph`. See doc/design/monorepo-tooling.md.

Output:
  Default — tree view, project per block, deps shown beneath. Each edge is
    suffixed with its kind: `(build)` or `(runtime)`. On TTY, project names
    are bold, build suffixes dim, runtime suffixes highlighted yellow.
  --format dot — DOT for Graphviz. Runtime edges rendered with style=dashed.

Pluggable: each source returns {project: [Edge, ...]}; main() merges by
(src, dst, kind). Add a function to SOURCES.
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
import tomllib
from dataclasses import dataclass
from pathlib import Path
from typing import Callable, Mapping


@dataclass(frozen=True)
class Edge:
    dst: str
    kind: str = "build"


Graph = Mapping[str, list[Edge]]


@dataclass(frozen=True)
class Context:
    root: Path


Source = Callable[[Context], Graph]


def repo_root() -> Path:
    out = subprocess.run(
        ["git", "rev-parse", "--show-toplevel"],
        check=True, capture_output=True, text=True,
    )
    return Path(out.stdout.strip())


def workspace_packages(ctx: Context) -> list[dict]:
    """Fetch the workspace package list from pnpm.

    Shared between sources so each can do its own transform without re-running
    pnpm. (We currently call it once per source; that's fine at this scale.)
    """
    proc = subprocess.run(
        ["pnpm", "-r", "list", "--depth", "0", "--json"],
        cwd=ctx.root, capture_output=True, text=True,
    )
    if proc.returncode != 0:
        raise RuntimeError(
            f"pnpm exited {proc.returncode}: {proc.stderr.strip() or '(no stderr)'}"
        )
    return json.loads(proc.stdout or "[]")


def read_service_toml(path: Path) -> dict | None:
    """Read a service.toml file, returning None if absent. Centralised so
    tests can patch this without mocking tomllib / Path directly."""
    if not path.exists():
        return None
    with open(path, "rb") as f:
        return tomllib.load(f)


# --- sources ---------------------------------------------------------------

def js_first_order(ctx: Context) -> dict[str, list[Edge]]:
    """Workspace-internal first-order build deps from pnpm."""
    return extract_build_edges(workspace_packages(ctx))


def runtime_deps_from_toml(ctx: Context) -> dict[str, list[Edge]]:
    """Runtime deps declared in each project's service.toml."""
    pkgs = workspace_packages(ctx)
    configs: dict[str, dict] = {}
    for pkg in pkgs:
        name = pkg.get("name")
        path = pkg.get("path")
        if name in (None, "root") or not path:
            continue
        cfg = read_service_toml(Path(path) / "service.toml")
        if cfg is not None:
            configs[name] = cfg
    return extract_runtime_edges(pkgs, configs)


# To add a source: write a Context -> Graph function and append it to SOURCES.
SOURCES: tuple[Source, ...] = (js_first_order, runtime_deps_from_toml)


# --- pure transforms (directly testable) -----------------------------------

def extract_build_edges(pkgs: list[dict]) -> dict[str, list[Edge]]:
    """pnpm list JSON -> {name: [Edge(dst, kind='build'), ...]}.

    Filters external deps; only edges to other workspace projects.
    """
    workspace_names = {p["name"] for p in pkgs if p.get("name") not in (None, "root")}
    graph: dict[str, list[Edge]] = {}
    for pkg in pkgs:
        name = pkg.get("name")
        if name in (None, "root"):
            continue
        dsts: set[str] = set()
        for kind in ("dependencies", "devDependencies"):
            for dep in (pkg.get(kind) or {}):
                if dep in workspace_names:
                    dsts.add(dep)
        graph[name] = [Edge(dst=d, kind="build") for d in sorted(dsts)]
    return graph


def extract_runtime_edges(
    pkgs: list[dict],
    configs: dict[str, dict],
) -> dict[str, list[Edge]]:
    """pkgs + {name: parsed service.toml} -> {name: [Edge(dst, kind='runtime')]}.

    Pure: caller does the file reading.
    """
    graph: dict[str, list[Edge]] = {}
    for pkg in pkgs:
        name = pkg.get("name")
        if name in (None, "root"):
            continue
        cfg = configs.get(name)
        if not cfg:
            continue
        deps = cfg.get("runtime", {}).get("depends_on", [])
        if deps:
            graph[name] = [Edge(dst=d, kind="runtime") for d in sorted(deps)]
    return graph


def merge(graphs: list[Graph]) -> dict[str, list[Edge]]:
    """Union edges across sources. Edges are deduped by (dst, kind), so the
    same pair as both a build and runtime edge keeps both."""
    merged: dict[str, set[Edge]] = {}
    for g in graphs:
        for src, edges in g.items():
            merged.setdefault(src, set()).update(edges)
    return {
        src: sorted(edges, key=lambda e: (e.dst, e.kind))
        for src, edges in sorted(merged.items())
    }


# --- formatters ------------------------------------------------------------

KIND_STYLE_TTY = {
    "build": "\033[2m",     # dim — recoverable from package.json, background
    "runtime": "\033[33m",  # yellow — load-bearing service relationship
}


def emit_tree(graph: Graph, file=None) -> None:
    if file is None:
        file = sys.stdout
    is_tty = file.isatty()
    bold = "\033[1m" if is_tty else ""
    reset = "\033[0m" if is_tty else ""
    styles = KIND_STYLE_TTY if is_tty else {}

    for src in sorted(graph):
        edges = graph[src]
        print(f"{bold}{src}{reset}", file=file)
        for i, edge in enumerate(edges):
            connector = "└──" if i == len(edges) - 1 else "├──"
            style = styles.get(edge.kind, "")
            suffix_reset = reset if style else ""
            print(f"{connector} {edge.dst} {style}({edge.kind}){suffix_reset}", file=file)


def emit_dot(graph: Graph, file=None) -> None:
    if file is None:
        file = sys.stdout
    print("digraph projects {", file=file)
    print('  rankdir="LR";', file=file)
    print("  node [shape=box];", file=file)
    for src in sorted(graph):
        edges = graph[src]
        if not edges:
            print(f'  "{src}";', file=file)
        for edge in edges:
            attrs = " [style=dashed]" if edge.kind == "runtime" else ""
            print(f'  "{src}" -> "{edge.dst}"{attrs};', file=file)
    print("}", file=file)


FORMATTERS = {"tree": emit_tree, "dot": emit_dot}


# --- CLI -------------------------------------------------------------------

def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        prog="projects-graph",
        description="Show first-order monorepo project dependencies.",
    )
    parser.add_argument(
        "--format", "-f", choices=list(FORMATTERS), default="tree",
        help="Output format. Default: tree (human-readable). Use dot for Graphviz.",
    )
    return parser.parse_args(argv)


def main(argv: list[str]) -> int:
    args = parse_args(argv)
    root = repo_root()
    ctx = Context(root=root)

    try:
        graphs = [source(ctx) for source in SOURCES]
    except RuntimeError as err:
        print(f"error: {err}", file=sys.stderr)
        return 1

    FORMATTERS[args.format](merge(graphs))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
