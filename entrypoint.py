#!/usr/bin/env python3
"""Validate an Atom/RSS feed using the bundled W3C feedvalidator."""
from __future__ import annotations

import os
import sys
import urllib.request
from dataclasses import dataclass, field
from pathlib import Path

import feedvalidator
from feedvalidator import compatibility, logging as fv_logging

COMPATIBILITY_LEVELS = ("A", "AA", "AAA")


@dataclass
class Issue:
    severity: str  # "error" | "warning" | "info"
    name: str
    line: int | None = None
    column: int | None = None
    params: dict = field(default_factory=dict)

    def location(self) -> str:
        if self.line is None:
            return ""
        col = self.column if self.column is not None else "?"
        return f"line {self.line} col {col}"

    def render(self) -> str:
        loc = self.location()
        prefix = f"{loc}: " if loc else ""
        return f"{prefix}{self.name}"


@dataclass
class Result:
    target: str
    events: list[Issue] = field(default_factory=list)

    @property
    def issues(self) -> list[Issue]:
        """Actionable events: errors and warnings only. Info events are excluded."""
        return [e for e in self.events if e.severity in ("error", "warning")]

    @property
    def info(self) -> list[Issue]:
        return [e for e in self.events if e.severity == "info"]

    @property
    def errors(self) -> int:
        return sum(1 for e in self.events if e.severity == "error")

    @property
    def warnings(self) -> int:
        return sum(1 for e in self.events if e.severity == "warning")


def classify(event) -> str:
    if isinstance(event, fv_logging.Error):
        return "error"
    if isinstance(event, fv_logging.Warning):
        return "warning"
    return "info"


def _to_url(target: str) -> str:
    if "://" in target:
        return target
    # pathname2url handles space/quote/non-ascii escaping correctly, and using
    # it here also keeps urllib.request loaded into sys.modules — feedvalidator
    # references urllib.request internally without importing it itself.
    return "file:" + urllib.request.pathname2url(os.path.abspath(target))


def validate(target: str, compat: str = "AA", origin_url: str = "") -> Result:
    if compat not in COMPATIBILITY_LEVELS:
        raise ValueError(
            f"Unknown compatibility level {compat!r}; expected one of {COMPATIBILITY_LEVELS}."
        )
    filter_func = getattr(compatibility, compat)

    is_url = "://" in target
    if origin_url and not is_url:
        with open(target, "rb") as fh:
            raw = feedvalidator.validateStream(fh, firstOccurrenceOnly=1, base=origin_url)
    else:
        raw = feedvalidator.validateURL(_to_url(target), firstOccurrenceOnly=1)
    events = filter_func(raw.get("loggedEvents", []))
    result = Result(target=target)
    for event in events:
        params = getattr(event, "params", {}) or {}
        result.events.append(
            Issue(
                severity=classify(event),
                name=event.__class__.__name__,
                line=params.get("line"),
                column=params.get("column"),
                params={
                    k: v
                    for k, v in params.items()
                    if k not in ("line", "column", "backupline", "backupcolumn")
                },
            )
        )
    return result


def _append(env_var: str, text: str) -> None:
    path = os.environ.get(env_var)
    if not path:
        return
    with open(path, "a") as fh:
        fh.write(text)


def _gha_escape(s: str) -> str:
    return s.replace("%", "%25").replace("\n", "%0A").replace("\r", "%0D")


def emit_gha(result: Result, fail_on: str) -> int:
    # Report file contains every event including info, so it's useful for
    # debugging via actions/upload-artifact. Outputs, summary, and annotations
    # are scoped to actionable issues (errors + warnings) only.
    report_path = Path(os.environ.get("RUNNER_TEMP", "/tmp")) / "feed-validator-report.txt"
    report_text = "".join(f"{e.severity.upper():7s} {e.render()}\n" for e in result.events)
    report_path.write_text(report_text or "(no events)\n")

    # Dump every event to the step log inside a collapsible group so the run
    # has the full validator output even when only some events get annotated.
    print(f"::group::Validator output for {result.target}")
    if result.events:
        for event in result.events:
            print(f"{event.severity.upper():7s} {event.render()}")
    else:
        print("(no events)")
    print("::endgroup::")

    _append(
        "GITHUB_OUTPUT",
        (
            f"errors={result.errors}\n"
            f"warnings={result.warnings}\n"
            f"issues={len(result.issues)}\n"
            f"report-path={report_path}\n"
        ),
    )

    summary_lines = [
        f"## Feed validation: `{result.target}`",
        "",
        f"- Errors: {result.errors}",
        f"- Warnings: {result.warnings}",
        "",
    ]
    if result.issues:
        summary_lines += ["```", *(f"{i.severity.upper():7s} {i.render()}" for i in result.issues), "```"]
    else:
        summary_lines.append("No issues reported.")
    _append("GITHUB_STEP_SUMMARY", "\n".join(summary_lines) + "\n")

    for issue in result.issues:
        print(f"::{issue.severity}::{_gha_escape(issue.render())}")

    fail_on = fail_on.lower()
    if fail_on == "never":
        return 0
    if fail_on == "warnings" and (result.errors or result.warnings):
        return 1
    if result.errors:
        return 1
    return 0


def main() -> int:
    if len(sys.argv) < 2:
        print("usage: entrypoint.py <feed-path-or-url>", file=sys.stderr)
        return 2
    target = sys.argv[1]
    fail_on = os.environ.get("FAIL_ON", "errors")
    compat = os.environ.get("COMPATIBILITY", "AA")
    origin_url = os.environ.get("ORIGIN_URL", "")
    return emit_gha(validate(target, compat=compat, origin_url=origin_url), fail_on)


if __name__ == "__main__":
    sys.exit(main())
