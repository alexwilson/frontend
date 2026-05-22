"""Contract tests for the validate-feed entrypoint."""
from pathlib import Path

import pytest

from entrypoint import Issue, Result, emit_gha, validate

FIXTURES = Path(__file__).parent / "fixtures"


def _has(result, name):
    return any(i.name == name for i in result.issues)


def test_valid_feed_reports_no_errors():
    result = validate(str(FIXTURES / "valid.atom"))
    # Loading via file:// triggers a SelfDoesntMatchLocation warning that
    # can't be avoided for a local fixture — origin always mismatches. Assert
    # only on errors; warnings on a structurally valid feed are expected here.
    assert result.errors == 0


def test_invalid_feed_reports_errors():
    result = validate(str(FIXTURES / "invalid.atom"))
    assert result.errors > 0


def test_compatibility_filters_events():
    # AAA is at least as permissive as A; exercises both levels in one shot.
    a = validate(str(FIXTURES / "invalid.atom"), compat="A")
    aaa = validate(str(FIXTURES / "invalid.atom"), compat="AAA")
    assert len(aaa.issues) >= len(a.issues)


def test_unknown_compatibility_level_raises():
    with pytest.raises(ValueError, match="Unknown compatibility level"):
        validate(str(FIXTURES / "valid.atom"), compat="BOGUS")


def test_origin_url_matching_self_link_suppresses_warning():
    # Fixture's self-link is http://example.org/feed.atom. Without origin_url,
    # loading via file:// triggers SelfDoesntMatchLocation. With a matching
    # origin_url, the validator believes the feed and the warning disappears.
    bare = validate(str(FIXTURES / "valid.atom"))
    with_origin = validate(
        str(FIXTURES / "valid.atom"),
        origin_url="http://example.org/feed.atom",
    )
    assert _has(bare, "SelfDoesntMatchLocation")
    assert not _has(with_origin, "SelfDoesntMatchLocation")


def test_origin_url_mismatch_still_warns():
    result = validate(
        str(FIXTURES / "valid.atom"),
        origin_url="http://different.example/somewhere.atom",
    )
    assert _has(result, "SelfDoesntMatchLocation")


@pytest.mark.parametrize(
    "fail_on,errors,warnings,expected_code",
    [
        ("errors", 1, 0, 1),    # any error fails
        ("errors", 0, 3, 0),    # warnings alone tolerated
        ("warnings", 0, 1, 1),  # warnings alone fails
        ("never", 99, 99, 0),   # never fails
    ],
)
def test_fail_on_exit_code(monkeypatch, tmp_path, fail_on, errors, warnings, expected_code):
    monkeypatch.setenv("RUNNER_TEMP", str(tmp_path))
    monkeypatch.delenv("GITHUB_OUTPUT", raising=False)
    monkeypatch.delenv("GITHUB_STEP_SUMMARY", raising=False)

    result = Result(
        target="x",
        events=(
            [Issue(severity="error", name="E")] * errors
            + [Issue(severity="warning", name="W")] * warnings
        ),
    )
    assert emit_gha(result, fail_on) == expected_code


def test_info_split_keeps_info_out_of_issues_but_in_report(monkeypatch, tmp_path):
    # AAA is the only compatibility level that surfaces info events.
    monkeypatch.setenv("RUNNER_TEMP", str(tmp_path))
    monkeypatch.delenv("GITHUB_OUTPUT", raising=False)
    monkeypatch.delenv("GITHUB_STEP_SUMMARY", raising=False)

    result = validate(str(FIXTURES / "valid.atom"), compat="AAA")
    emit_gha(result, "errors")

    assert result.info, "expected at least one info event at AAA"
    assert all(i.severity in ("error", "warning") for i in result.issues)
    assert "INFO" in (tmp_path / "feed-validator-report.txt").read_text()


def test_emit_gha_prints_event_group_to_stdout(monkeypatch, tmp_path, capsys):
    monkeypatch.setenv("RUNNER_TEMP", str(tmp_path))
    monkeypatch.delenv("GITHUB_OUTPUT", raising=False)
    monkeypatch.delenv("GITHUB_STEP_SUMMARY", raising=False)

    result = validate(str(FIXTURES / "valid.atom"), compat="AAA")
    emit_gha(result, "errors")
    out = capsys.readouterr().out
    assert "::group::Validator output" in out
    assert "::endgroup::" in out
    assert "INFO" in out


def test_emit_gha_writes_outputs_and_summary(monkeypatch, tmp_path):
    output_file = tmp_path / "output"
    summary_file = tmp_path / "summary"
    output_file.touch()
    summary_file.touch()
    monkeypatch.setenv("RUNNER_TEMP", str(tmp_path))
    monkeypatch.setenv("GITHUB_OUTPUT", str(output_file))
    monkeypatch.setenv("GITHUB_STEP_SUMMARY", str(summary_file))

    result = validate(str(FIXTURES / "invalid.atom"))
    emit_gha(result, "errors")

    out = output_file.read_text()
    assert f"errors={result.errors}" in out
    assert f"warnings={result.warnings}" in out
    assert f"issues={len(result.issues)}" in out
    assert "report-path=" in out

    summary = summary_file.read_text()
    assert "Feed validation:" in summary
    assert f"Errors: {result.errors}" in summary
