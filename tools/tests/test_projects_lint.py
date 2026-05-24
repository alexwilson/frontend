#!/usr/bin/env python3
"""Tests for projects_lint.py."""
from __future__ import annotations

import contextlib
import io
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import projects_lint as pl


class ServicesHaveServiceTomlTest(unittest.TestCase):
    def test_no_services_dir_is_fine(self):
        with tempfile.TemporaryDirectory() as td:
            ctx = pl.Context(root=Path(td))
            self.assertEqual(pl.services_have_service_toml(ctx), [])

    def test_service_with_toml_is_fine(self):
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            (root / "services" / "auth").mkdir(parents=True)
            (root / "services" / "auth" / "service.toml").write_text("[runtime]\n")
            ctx = pl.Context(root=root)
            self.assertEqual(pl.services_have_service_toml(ctx), [])

    def test_service_without_toml_is_issue(self):
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            (root / "services" / "auth").mkdir(parents=True)
            ctx = pl.Context(root=root)
            issues = pl.services_have_service_toml(ctx)
            self.assertEqual(len(issues), 1)
            self.assertEqual(issues[0].path, "services/auth")
            self.assertIn("service.toml", issues[0].message)

    def test_stray_files_in_services_ignored(self):
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            (root / "services").mkdir()
            (root / "services" / "README.md").write_text("notes")
            ctx = pl.Context(root=root)
            self.assertEqual(pl.services_have_service_toml(ctx), [])

    def test_mixed_state(self):
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            (root / "services" / "ok").mkdir(parents=True)
            (root / "services" / "ok" / "service.toml").touch()
            (root / "services" / "missing").mkdir(parents=True)
            ctx = pl.Context(root=root)
            issues = pl.services_have_service_toml(ctx)
            self.assertEqual([i.path for i in issues], ["services/missing"])


class ComponentsHavePackageJsonTest(unittest.TestCase):
    def test_no_components_dir_is_fine(self):
        with tempfile.TemporaryDirectory() as td:
            ctx = pl.Context(root=Path(td))
            self.assertEqual(pl.components_have_package_json(ctx), [])

    def test_component_with_pkg_is_fine(self):
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            (root / "components" / "icons").mkdir(parents=True)
            (root / "components" / "icons" / "package.json").write_text("{}")
            ctx = pl.Context(root=root)
            self.assertEqual(pl.components_have_package_json(ctx), [])

    def test_component_without_pkg_is_issue(self):
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            (root / "components" / "icons").mkdir(parents=True)
            ctx = pl.Context(root=root)
            issues = pl.components_have_package_json(ctx)
            self.assertEqual(len(issues), 1)
            self.assertEqual(issues[0].path, "components/icons")
            self.assertIn("package.json", issues[0].message)


class EmitTextTest(unittest.TestCase):
    def test_silent_on_no_issues(self):
        buf = io.StringIO()
        pl.emit_text([], file=buf)
        self.assertEqual(buf.getvalue(), "")

    def test_lists_issues(self):
        buf = io.StringIO()
        pl.emit_text(
            [pl.Issue(path="services/x", message="missing y")],
            file=buf,
        )
        out = buf.getvalue()
        self.assertIn("services/x", out)
        self.assertIn("missing y", out)
        self.assertIn("✗", out)

    def test_no_escapes_off_tty(self):
        buf = io.StringIO()
        pl.emit_text([pl.Issue(path="x", message="y")], file=buf)
        self.assertNotIn("\033[", buf.getvalue())

    def test_red_cross_on_tty(self):
        class TtyBuf(io.StringIO):
            def isatty(self):
                return True
        buf = TtyBuf()
        pl.emit_text([pl.Issue(path="x", message="y")], file=buf)
        self.assertIn("\033[31m", buf.getvalue())
        self.assertIn("\033[0m", buf.getvalue())


class EmitJsonTest(unittest.TestCase):
    def test_emits_compact_array(self):
        buf = io.StringIO()
        pl.emit_json([pl.Issue(path="x", message="y")], file=buf)
        self.assertEqual(buf.getvalue(), '[{"path":"x","message":"y"}]\n')

    def test_empty_array_when_no_issues(self):
        buf = io.StringIO()
        pl.emit_json([], file=buf)
        self.assertEqual(buf.getvalue(), "[]\n")


class ParseArgsTest(unittest.TestCase):
    def test_default(self):
        self.assertFalse(pl.parse_args([]).json)

    def test_json_flag(self):
        self.assertTrue(pl.parse_args(["--json"]).json)


class MainTest(unittest.TestCase):
    def test_exit_0_when_clean(self):
        with tempfile.TemporaryDirectory() as td:
            with patch.object(pl, "repo_root", return_value=Path(td)), \
                    contextlib.redirect_stdout(io.StringIO()):
                self.assertEqual(pl.main([]), 0)

    def test_exit_1_when_issues_found(self):
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            (root / "services" / "missing").mkdir(parents=True)
            with patch.object(pl, "repo_root", return_value=root), \
                    contextlib.redirect_stdout(io.StringIO()):
                self.assertEqual(pl.main([]), 1)

    def test_issues_sorted_by_path(self):
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            (root / "services" / "z").mkdir(parents=True)
            (root / "services" / "a").mkdir(parents=True)
            (root / "components" / "m").mkdir(parents=True)
            buf = io.StringIO()
            with patch.object(pl, "repo_root", return_value=root), \
                    contextlib.redirect_stdout(buf):
                pl.main(["--json"])
            import json as _json
            issues = _json.loads(buf.getvalue())
            self.assertEqual(
                [i["path"] for i in issues],
                ["components/m", "services/a", "services/z"],
            )


if __name__ == "__main__":
    unittest.main()
