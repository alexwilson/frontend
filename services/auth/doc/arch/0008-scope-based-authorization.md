# 0008. Scope-based authorization

Date: 2026-05-17

## Status

Accepted

## Context

Authorisation needs to scale to multiple apps, each with multiple
sub-permissions. The simplest model is binary role-based gating
(`requiredRoles: ['cms-editor', 'admin']`). It works for "can / can't
use the CMS" but doesn't generalise:

- "Can edit posts but not publish" requires sub-permissions per app.
- External token consumers speak OAuth scopes, not bespoke roles.
- Each new capability per app means adding a new role with inheritance
  rules. That gets messy fast.

The OAuth ecosystem solved this decades ago with **scopes**: per-call,
fine-grained, intersected against what the caller is authorised to
request.

## Decision

Authorisation at runtime is **scope-based**. Roles are still the
human-facing assignment surface in the admin UI (admin sets a user
to `cms-editor`), and they map to scope sets via a `ROLE_SCOPES`
table.

At runtime, every token-broker call computes:

```
final_scope = (requested) ∩ (app.grantedScopes) ∩ (scopesForRole(user.role))
```

- An app can never hand out a scope it doesn't own (`grantedScopes`).
- A user can never receive a scope their role doesn't carry.
- The caller can request a subset (RFC 6749 §3.3 space-delimited
  `scope` parameter, via query string or POST body).
- An empty result returns 403 with `insufficient_scope`.

JWT #2's payload carries the final `scope` claim, so downstream
verifiers know what was granted.

## Consequences

**Positive:**
- Industry-standard model. Anyone who has worked with OAuth recognises it.
- Fine-grained. `cms:read` / `cms:write` / `cms:publish` are distinct
  scopes today, and future apps add their own without affecting others.
- External consumers can request specific scopes; we can issue
  scope-restricted tokens for narrow integrations.
- Roles stay admin-friendly (single dropdown, no scope checkboxes).

**Negative:**
- The two-level model adds one indirection: roles → scopes → checks. A
  new contributor might add a role and forget to map it in
  `ROLE_SCOPES`, leaving the role with no actual capabilities.
  Catchable in code review.
- The role→scope map (`ROLE_SCOPES`) is a single point of truth that
  must stay current as scopes are added. A scope defined but not
  assigned to any role is silently inert.

**Neutral:**
- `admin` is currently mapped to every defined scope. We list them
  explicitly rather than using a wildcard. The fail-safe behaviour is
  that a new scope added without being assigned to admin makes admin
  lose access to it, which surfaces in testing.

## References

- [RFC 6749 §3.3, OAuth 2.0 access scope](https://datatracker.ietf.org/doc/html/rfc6749#section-3.3)
- [RFC 9068, JWT Access Tokens](https://datatracker.ietf.org/doc/html/rfc9068) (uses `scope` claim)
