#!/usr/bin/env python3
"""Tests for projects_list.py."""
from __future__ import annotations

import contextlib
import io
import unittest
from pathlib import Path
from unittest.mock import patch

import projects_list as lp


class DedupeSortTest(unittest.TestCase):
    def test_dedupe_by_name_sort_by_path(self):
        projects = [
            lp.Project("@scope/b", "services/b"),
            lp.Project("@scope/a", "services/a"),
            lp.Project("@scope/a", "services/a"),  # duplicate
        ]
        self.assertEqual(
            lp.dedupe_sort(projects),
            [lp.Project("@scope/a", "services/a"), lp.Project("@scope/b", "services/b")],
        )

    def test_first_occurrence_wins(self):
        projects = [
            lp.Project("@scope/x", "first"),
            lp.Project("@scope/x", "second"),
        ]
        self.assertEqual(lp.dedupe_sort(projects), [lp.Project("@scope/x", "first")])


class EmitJsonTest(unittest.TestCase):
    def test_emits_compact_array(self):
        buf = io.StringIO()
        with contextlib.redirect_stdout(buf):
            lp.emit_json([lp.Project("a", "p/a"), lp.Project("b", "p/b")])
        self.assertEqual(buf.getvalue(), '[{"name":"a","path":"p/a"},{"name":"b","path":"p/b"}]\n')


class EmitTableTest(unittest.TestCase):
    def test_no_escapes_when_not_tty(self):
        buf = io.StringIO()  # StringIO.isatty() returns False
        with contextlib.redirect_stdout(buf):
            lp.emit_table([lp.Project("alpha", "p/alpha")])
        out = buf.getvalue()
        self.assertNotIn("\033[", out)
        self.assertIn("NAME", out)
        self.assertIn("alpha", out)

    def test_bold_when_tty(self):
        class TtyBuf(io.StringIO):
            def isatty(self):
                return True

        buf = TtyBuf()
        with contextlib.redirect_stdout(buf):
            lp.emit_table([lp.Project("alpha", "p/alpha")])
        self.assertIn("\033[1m", buf.getvalue())
        self.assertIn("\033[0m", buf.getvalue())


class JsSourceTest(unittest.TestCase):
    ROOT = Path("/repo")

    def _ctx(self, since=None, filters=()):
        return lp.Context(root=self.ROOT, since=since, filters=filters)

    def test_no_narrowing_calls_pnpm_without_filters(self):
        with patch.object(lp, "pnpm_list", return_value=[lp.Project("a", "p/a")]) as m:
            result = lp.js_source(self._ctx())
        m.assert_called_once_with(self.ROOT)
        self.assertEqual(result, [lp.Project("a", "p/a")])

    def test_since_translates_to_bracket_filter(self):
        with patch.object(lp, "pnpm_list", return_value=[lp.Project("a", "p/a")]) as m:
            lp.js_source(self._ctx(since="HEAD~1"))
        m.assert_called_once_with(self.ROOT, "[HEAD~1]...")

    def test_filter_passed_through(self):
        with patch.object(lp, "pnpm_list", return_value=[]) as m:
            lp.js_source(self._ctx(filters=("@scope/a",)))
        m.assert_called_once_with(self.ROOT, "@scope/a")

    def test_since_plus_filter_unions_in_one_call(self):
        with patch.object(lp, "pnpm_list", return_value=[lp.Project("x", "p/x")]) as m:
            lp.js_source(self._ctx(since="HEAD~1", filters=("@scope/a",)))
        m.assert_called_once_with(self.ROOT, "[HEAD~1]...", "@scope/a")

    def test_since_only_empty_result_falls_back_to_all(self):
        responses = [[], [lp.Project("a", "p/a"), lp.Project("b", "p/b")]]
        with patch.object(lp, "pnpm_list", side_effect=lambda *a: responses.pop(0)), \
                contextlib.redirect_stderr(io.StringIO()):
            result = lp.js_source(self._ctx(since="HEAD~1"))
        self.assertEqual(len(result), 2)

    def test_since_only_filter_error_falls_back_with_warning(self):
        responses = [RuntimeError("boom"), [lp.Project("a", "p/a")]]

        def fake(*args):
            r = responses.pop(0)
            if isinstance(r, Exception):
                raise r
            return r

        stderr = io.StringIO()
        with patch.object(lp, "pnpm_list", side_effect=fake), contextlib.redirect_stderr(stderr):
            result = lp.js_source(self._ctx(since="HEAD~1"))
        self.assertEqual(result, [lp.Project("a", "p/a")])
        self.assertIn("::warning::", stderr.getvalue())

    def test_filter_error_without_since_propagates(self):
        with patch.object(lp, "pnpm_list", side_effect=RuntimeError("boom")):
            with self.assertRaises(RuntimeError):
                lp.js_source(self._ctx(filters=("bogus",)))

    def test_since_plus_filter_does_not_fall_back_on_empty(self):
        # Both --since and --filter set: since_only is False, so empty result
        # is respected (user's filter narrowed it). No retry.
        with patch.object(lp, "pnpm_list", return_value=[]) as m:
            result = lp.js_source(self._ctx(since="HEAD~1", filters=("@scope/a",)))
        self.assertEqual(result, [])
        self.assertEqual(m.call_count, 1)


class ParseArgsTest(unittest.TestCase):
    def test_defaults(self):
        ns = lp.parse_args([])
        self.assertFalse(ns.json)
        self.assertIsNone(ns.since)
        self.assertEqual(ns.filters, [])

    def test_repeatable_filter(self):
        ns = lp.parse_args(["--filter", "a", "--filter", "b"])
        self.assertEqual(ns.filters, ["a", "b"])

    def test_since_equals_form(self):
        ns = lp.parse_args(["--since=HEAD~1"])
        self.assertEqual(ns.since, "HEAD~1")

    def test_empty_since_rejected(self):
        with self.assertRaises(SystemExit), contextlib.redirect_stderr(io.StringIO()):
            lp.parse_args(["--since="])

    def test_empty_filter_rejected(self):
        with self.assertRaises(SystemExit), contextlib.redirect_stderr(io.StringIO()):
            lp.parse_args(["--filter="])


if __name__ == "__main__":
    unittest.main()
