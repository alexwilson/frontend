// Email normalization + confusable/homoglyph rejection for the allowlist.
//
// Threat: an admin pastes `alex@аlexwilson.tech` (Cyrillic а, U+0430) into
// the allowlist, thinking it's `alex@alexwilson.tech` (Latin a, U+0061). Both
// render identically. Once stored, an attacker controlling the homoglyph
// domain can sign up as a verified user.
//
// Two-layer defence:
//   1. NFKC normalize on store + read. Folds compatibility characters
//      (fullwidth `ａ` → `a`, ligature `ﬁ` → `fi`, composed/decomposed
//      forms). Doesn't help cross-script homoglyphs (Cyrillic а stays
//      Cyrillic), but kills another class of attack and ensures equality
//      checks compare canonical forms.
//   2. Reject Latin + non-Latin-but-Latin-looking script mixes per
//      local-part and per domain. The scripts listed here are the ones
//      with known Latin look-alikes in Unicode's confusables data; legit
//      Japanese (Han + Hiragana + Katakana) / Arabic / Hebrew etc. emails
//      do not mix Latin into the same identifier component, so they pass.
//
// What this is NOT: a full implementation of Unicode TR39 (Unicode Security
// Mechanisms). For that we'd want a library and a confusables database.
// This is a pragmatic mid-strength control that fits in one file.

const LATIN_LETTER_RE = /\p{Script=Latin}/u

// Scripts known to contain Latin look-alikes. Source: Unicode confusables
// (https://www.unicode.org/Public/security/latest/confusables.txt) — these
// are the scripts most commonly used in homoglyph attacks against domain
// names and identifiers.
const CONFUSABLE_SCRIPTS: Record<string, RegExp> = {
  Cyrillic: /\p{Script=Cyrillic}/u,
  Greek: /\p{Script=Greek}/u,
  Armenian: /\p{Script=Armenian}/u,
  Cherokee: /\p{Script=Cherokee}/u,
}

export type NormalizeResult =
  | { ok: true; email: string }
  | { ok: false; error: string }

export function normalizeEmail(raw: string): NormalizeResult {
  const trimmed = raw.trim()
  if (!trimmed) return { ok: false, error: 'empty email' }

  // NFKC normalize first so any compatibility characters fold before the
  // mixed-script check (otherwise e.g. fullwidth Latin would not test as
  // Latin under the script regex).
  const normalized = trimmed.normalize('NFKC').toLowerCase()

  const atIndex = normalized.lastIndexOf('@')
  if (atIndex <= 0 || atIndex === normalized.length - 1) {
    return { ok: false, error: 'invalid email' }
  }
  const local = normalized.slice(0, atIndex)
  const domain = normalized.slice(atIndex + 1)

  for (const [label, part] of [['local-part', local] as const, ['domain', domain] as const]) {
    if (!LATIN_LETTER_RE.test(part)) continue
    for (const [script, re] of Object.entries(CONFUSABLE_SCRIPTS)) {
      if (re.test(part)) {
        return {
          ok: false,
          error: `${label} mixes Latin with ${script} letters — possible homoglyph (rejected)`,
        }
      }
    }
  }

  return { ok: true, email: normalized }
}
