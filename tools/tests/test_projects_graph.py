#!/usr/bin/env python3
"""Tests for projects_graph.py."""
from __future__ import annotations

import contextlib
import io
import unittest
from pathlib import Path
from unittest.mock import patch

import projects_graph as pg


def build(*names: str) -> list[pg.Edge]:
    return [pg.Edge(dst=n, kind="build") for n in names]


def runtime(*names: str) -> list[pg.Edge]:
    return [pg.Edge(dst=n, kind="runtime") for n in names]


class ExtractBuildEdgesTest(unittest.TestCase):
    def test_filters_external_deps(self):
        raw = [
            {"name": "@scope/a", "dependencies": {"@scope/b": "1.0.0", "react": "18"}},
            {"name": "@scope/b"},
        ]
        self.assertEqual(
            pg.extract_build_edges(raw),
            {"@scope/a": build("@scope/b"), "@scope/b": []},
        )

    def test_includes_dev_dependencies(self):
        raw = [
            {"name": "@scope/a", "devDependencies": {"@scope/b": "1.0.0"}},
            {"name": "@scope/b"},
        ]
        self.assertEqual(pg.extract_build_edges(raw)["@scope/a"], build("@scope/b"))

    def test_unions_deps_and_devdeps(self):
        raw = [
            {
                "name": "@scope/a",
                "dependencies": {"@scope/b": "1"},
                "devDependencies": {"@scope/c": "1"},
            },
            {"name": "@scope/b"},
            {"name": "@scope/c"},
        ]
        self.assertEqual(
            pg.extract_build_edges(raw)["@scope/a"], build("@scope/b", "@scope/c")
        )

    def test_dedupe_when_dep_in_both_kinds(self):
        raw = [
            {
                "name": "@scope/a",
                "dependencies": {"@scope/b": "1"},
                "devDependencies": {"@scope/b": "1"},
            },
            {"name": "@scope/b"},
        ]
        self.assertEqual(pg.extract_build_edges(raw)["@scope/a"], build("@scope/b"))

    def test_edges_sorted(self):
        raw = [
            {"name": "@scope/a", "dependencies": {"@scope/c": "1", "@scope/b": "1"}},
            {"name": "@scope/b"},
            {"name": "@scope/c"},
        ]
        self.assertEqual(
            pg.extract_build_edges(raw)["@scope/a"], build("@scope/b", "@scope/c")
        )

    def test_root_entry_skipped(self):
        raw = [
            {"name": "root", "dependencies": {"@scope/a": "1"}},
            {"name": "@scope/a"},
        ]
        self.assertNotIn("root", pg.extract_build_edges(raw))

    def test_isolated_workspace_pkg_present_with_empty_edges(self):
        self.assertEqual(
            pg.extract_build_edges([{"name": "@scope/lonely"}]),
            {"@scope/lonely": []},
        )


class ExtractRuntimeEdgesTest(unittest.TestCase):
    def test_emits_runtime_edges_from_config(self):
        pkgs = [{"name": "@scope/a"}, {"name": "@scope/b"}]
        configs = {"@scope/a": {"runtime": {"depends_on": ["@scope/b"]}}}
        self.assertEqual(
            pg.extract_runtime_edges(pkgs, configs),
            {"@scope/a": runtime("@scope/b")},
        )

    def test_no_config_means_no_edges(self):
        pkgs = [{"name": "@scope/a"}, {"name": "@scope/b"}]
        self.assertEqual(pg.extract_runtime_edges(pkgs, {}), {})

    def test_empty_depends_on_means_no_entry(self):
        pkgs = [{"name": "@scope/a"}]
        configs = {"@scope/a": {"runtime": {"depends_on": []}}}
        self.assertEqual(pg.extract_runtime_edges(pkgs, configs), {})

    def test_missing_runtime_section_means_no_entry(self):
        pkgs = [{"name": "@scope/a"}]
        configs = {"@scope/a": {"deploy": {"target": "x"}}}  # other section only
        self.assertEqual(pg.extract_runtime_edges(pkgs, configs), {})

    def test_root_entry_skipped(self):
        pkgs = [{"name": "root"}]
        configs = {"root": {"runtime": {"depends_on": ["@scope/a"]}}}
        self.assertEqual(pg.extract_runtime_edges(pkgs, configs), {})

    def test_sorted(self):
        pkgs = [{"name": "@scope/a"}]
        configs = {"@scope/a": {"runtime": {"depends_on": ["@scope/c", "@scope/b"]}}}
        self.assertEqual(
            pg.extract_runtime_edges(pkgs, configs)["@scope/a"],
            runtime("@scope/b", "@scope/c"),
        )


class ReadServiceTomlTest(unittest.TestCase):
    def test_returns_none_when_missing(self):
        self.assertIsNone(pg.read_service_toml(Path("/nonexistent/service.toml")))


class MergeTest(unittest.TestCase):
    def test_unions_edges_across_sources(self):
        a = {"@scope/x": build("@scope/y")}
        b = {"@scope/x": build("@scope/z"), "@scope/y": []}
        self.assertEqual(
            pg.merge([a, b]),
            {"@scope/x": build("@scope/y", "@scope/z"), "@scope/y": []},
        )

    def test_keeps_build_and_runtime_edges_for_same_pair(self):
        a = {"@scope/x": build("@scope/y")}
        b = {"@scope/x": runtime("@scope/y")}
        merged = pg.merge([a, b])
        self.assertEqual(len(merged["@scope/x"]), 2)
        self.assertIn(pg.Edge(dst="@scope/y", kind="build"), merged["@scope/x"])
        self.assertIn(pg.Edge(dst="@scope/y", kind="runtime"), merged["@scope/x"])

    def test_dedupes_identical_edges(self):
        a = {"@scope/x": build("@scope/y")}
        b = {"@scope/x": build("@scope/y")}
        self.assertEqual(pg.merge([a, b]), {"@scope/x": build("@scope/y")})

    def test_nodes_sorted(self):
        result = pg.merge([{"@scope/c": [], "@scope/a": [], "@scope/b": []}])
        self.assertEqual(list(result), ["@scope/a", "@scope/b", "@scope/c"])

    def test_edges_sorted_by_dst_then_kind(self):
        edges = build("@scope/b") + runtime("@scope/a")
        result = pg.merge([{"@scope/x": edges}])
        self.assertEqual(
            [(e.dst, e.kind) for e in result["@scope/x"]],
            [("@scope/a", "runtime"), ("@scope/b", "build")],
        )


class EmitTreeTest(unittest.TestCase):
    def test_renders_branches_for_deps(self):
        buf = io.StringIO()
        pg.emit_tree({"@scope/a": build("@scope/b", "@scope/c")}, file=buf)
        out = buf.getvalue()
        self.assertIn("├── @scope/b", out)
        self.assertIn("└── @scope/c", out)

    def test_both_kinds_get_suffix(self):
        buf = io.StringIO()
        pg.emit_tree(
            {"@scope/a": build("@scope/b"), "@scope/c": runtime("@scope/d")},
            file=buf,
        )
        out = buf.getvalue()
        self.assertIn("@scope/b (build)", out)
        self.assertIn("@scope/d (runtime)", out)

    def test_no_color_codes_off_tty(self):
        buf = io.StringIO()
        pg.emit_tree(
            {"@scope/a": build("@scope/b") + runtime("@scope/c")},
            file=buf,
        )
        # No ANSI escapes at all when stdout isn't a TTY.
        self.assertNotIn("\033[", buf.getvalue())

    def test_runtime_highlighted_distinctly_from_build_on_tty(self):
        class TtyBuf(io.StringIO):
            def isatty(self):
                return True
        buf = TtyBuf()
        pg.emit_tree(
            {"@scope/a": build("@scope/b") + runtime("@scope/c")},
            file=buf,
        )
        out = buf.getvalue()
        # Each kind gets a different ANSI code in front of its suffix.
        self.assertIn(pg.KIND_STYLE_TTY["build"] + "(build)", out)
        self.assertIn(pg.KIND_STYLE_TTY["runtime"] + "(runtime)", out)
        self.assertNotEqual(pg.KIND_STYLE_TTY["build"], pg.KIND_STYLE_TTY["runtime"])

    def test_isolated_node_just_name(self):
        buf = io.StringIO()
        pg.emit_tree({"@scope/lonely": []}, file=buf)
        self.assertEqual(buf.getvalue().strip(), "@scope/lonely")

    def test_bold_project_names_on_tty(self):
        class TtyBuf(io.StringIO):
            def isatty(self):
                return True
        buf = TtyBuf()
        pg.emit_tree({"@scope/a": build("@scope/b")}, file=buf)
        self.assertIn("\033[1m@scope/a\033[0m", buf.getvalue())


class EmitDotTest(unittest.TestCase):
    def test_directed_graph_with_build_edge(self):
        buf = io.StringIO()
        pg.emit_dot({"@scope/a": build("@scope/b"), "@scope/b": []}, file=buf)
        out = buf.getvalue()
        self.assertIn("digraph projects {", out)
        self.assertIn('"@scope/a" -> "@scope/b";', out)
        self.assertIn('"@scope/b";', out)
        self.assertTrue(out.rstrip().endswith("}"))

    def test_runtime_edge_dashed(self):
        buf = io.StringIO()
        pg.emit_dot({"@scope/a": runtime("@scope/b")}, file=buf)
        self.assertIn('"@scope/a" -> "@scope/b" [style=dashed];', buf.getvalue())

    def test_isolated_nodes_emitted(self):
        buf = io.StringIO()
        pg.emit_dot({"@scope/lonely": []}, file=buf)
        self.assertIn('"@scope/lonely";', buf.getvalue())


class ParseArgsTest(unittest.TestCase):
    def test_default_format_is_tree(self):
        self.assertEqual(pg.parse_args([]).format, "tree")

    def test_format_dot(self):
        self.assertEqual(pg.parse_args(["--format", "dot"]).format, "dot")

    def test_format_short_flag(self):
        self.assertEqual(pg.parse_args(["-f", "dot"]).format, "dot")

    def test_invalid_format_rejected(self):
        with self.assertRaises(SystemExit), contextlib.redirect_stderr(io.StringIO()):
            pg.parse_args(["--format", "ascii"])


class JsFirstOrderTest(unittest.TestCase):
    def test_pnpm_error_propagates_as_runtimeerror(self):
        proc = unittest.mock.MagicMock()
        proc.returncode = 1
        proc.stderr = "boom"
        proc.stdout = ""
        with patch.object(pg.subprocess, "run", return_value=proc):
            with self.assertRaises(RuntimeError) as cm:
                pg.workspace_packages(pg.Context(root=Path("/repo")))
        self.assertIn("pnpm exited 1", str(cm.exception))


class RuntimeDepsFromTomlTest(unittest.TestCase):
    def test_reads_service_toml_for_each_project(self):
        ctx = pg.Context(root=Path("/repo"))
        pkgs = [
            {"name": "@scope/a", "path": "/repo/services/a"},
            {"name": "@scope/b", "path": "/repo/services/b"},
            {"name": "@scope/lib", "path": "/repo/libraries/lib"},
        ]

        def fake_read(path):
            # Only @scope/a has a service.toml; the others don't.
            if str(path) == "/repo/services/a/service.toml":
                return {"runtime": {"depends_on": ["@scope/b"]}}
            return None

        with patch.object(pg, "workspace_packages", return_value=pkgs), \
                patch.object(pg, "read_service_toml", side_effect=fake_read):
            result = pg.runtime_deps_from_toml(ctx)

        self.assertEqual(result, {"@scope/a": runtime("@scope/b")})

    def test_skips_root_entry(self):
        ctx = pg.Context(root=Path("/repo"))
        pkgs = [{"name": "root", "path": "/repo"}]

        with patch.object(pg, "workspace_packages", return_value=pkgs), \
                patch.object(pg, "read_service_toml") as mock_read:
            result = pg.runtime_deps_from_toml(ctx)

        self.assertEqual(result, {})
        mock_read.assert_not_called()


class MainTest(unittest.TestCase):
    def test_runtimeerror_in_source_becomes_exit_1(self):
        def boom(ctx):
            raise RuntimeError("nope")

        with patch.object(pg, "SOURCES", (boom,)), \
                patch.object(pg, "repo_root", return_value=Path("/repo")), \
                contextlib.redirect_stderr(io.StringIO()):
            rc = pg.main([])
        self.assertEqual(rc, 1)


if __name__ == "__main__":
    unittest.main()
