#!/usr/bin/env python3
"""Show first-order monorepo project dependencies."""
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
    if not path.exists():
        return None
    with open(path, "rb") as f:
        return tomllib.load(f)


def js_first_order(ctx: Context) -> dict[str, list[Edge]]:
    return extract_build_edges(workspace_packages(ctx))


def runtime_deps_from_toml(ctx: Context) -> dict[str, list[Edge]]:
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


SOURCES: tuple[Source, ...] = (js_first_order, runtime_deps_from_toml)


def extract_build_edges(pkgs: list[dict]) -> dict[str, list[Edge]]:
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
    """Union edges across sources, deduped by (dst, kind)."""
    merged: dict[str, set[Edge]] = {}
    for g in graphs:
        for src, edges in g.items():
            merged.setdefault(src, set()).update(edges)
    return {
        src: sorted(edges, key=lambda e: (e.dst, e.kind))
        for src, edges in sorted(merged.items())
    }


KIND_STYLE_TTY = {
    "build": "\033[2m",
    "runtime": "\033[33m",
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
