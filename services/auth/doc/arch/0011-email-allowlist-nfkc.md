# 0011. Email allowlist with NFKC + mixed-script rejection

Date: 2026-05-17

## Status

Accepted

## Context

Sign-up must be gated. Allowing any GitHub user to create an account
is too open; the allowlist limits sign-ups to a curated set of
emails managed by an admin.

A naïve allowlist (case-insensitive string equality) is vulnerable
to **homoglyph attacks**. Unicode contains many visually identical
characters from different scripts; a character substituted from
another script renders identically in most fonts but compares as a
different codepoint.

Two attack vectors:

1. **Admin enters a homoglyph.** They copy-paste an email from
   somewhere that contains a substituted character. The "looks
   right" check passes, and the allowlist now contains a domain the
   attacker controls.
2. **Upstream sign-in with a homoglyph.** The attacker registers
   with the upstream provider using a homoglyph address; the
   sign-up check passes against a maliciously added allowlist entry
   from (1).

Full prevention would require [Unicode TR39](https://www.unicode.org/reports/tr39/)
restriction-level enforcement (probably "Highly Restrictive": single
script per identifier) backed by a confusables database. That's a
library dependency we'd rather avoid for a personal-scale concern.

## Decision

Two-layer defence in the email-normalisation module:

1. **NFKC normalisation** on both write (admin entering an allowlist
   email) and read (the sign-up hook checking the upstream-provided
   email). NFKC folds compatibility characters: fullwidth Latin `ａ`
   (U+FF41) becomes ASCII `a`, ligature `ﬁ` becomes `fi`, composed
   and decomposed forms align. This catches one class of visual
   deception.
2. **Mixed-script rejection** on write. If an email's local-part or
   domain contains Latin letters mixed with letters from a known
   confusable script, reject with a clear error. This catches the
   common case where a homoglyph character is pasted into an
   otherwise-Latin identifier.

The scripts we check are those known to contain Latin look-alikes
in the Unicode confusables database. Legitimate Japanese
(Han + Hiragana + Katakana), Arabic, or Hebrew emails don't trigger
the check, because they don't mix Latin into the same identifier
component.

The read path normalises but doesn't run the mixed-script check.
Malformed emails coming back from the upstream just fail the
equality lookup. The write path is where contamination can happen,
so that's where the check belongs.

## Consequences

**Positive:**
- The realistic attacks against an admin-curated allowlist are
  blocked.
- No third-party Unicode library. A small amount of pure JS using
  built-in `String.prototype.normalize` and `\p{Script=...}` regex.
- Failures surface as readable errors in the admin UI rather than
  silent rejection.

**Negative:**
- Not full UTS 39 coverage. A more sophisticated attack would have
  to also defeat the allowlist comparison itself, but the layered
  defence is weaker than a full confusables implementation.
- Rejects legitimate mixed-script emails. Rare in practice; manual
  override would be needed if a real user hit this.

**Neutral:**
- The implementation has dedicated tests with examples of each
  rejected case, so the intent stays obvious to future readers.

## References

- [Unicode TR15, Normalization](https://www.unicode.org/reports/tr15/) (NFKC)
- [Unicode TR39, Security Mechanisms](https://www.unicode.org/reports/tr39/)
- [Unicode confusables data](https://www.unicode.org/Public/security/latest/confusables.txt)
