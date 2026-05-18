# Brokered GitHub backend for Decap CMS

A custom Decap CMS backend that swaps Decap's stock GitHub OAuth flow for one
that brokers per-app GitHub App credentials through our auth worker. Decap
gets the `ghu_*` token it expects; the SPA never holds long-lived GitHub
credentials directly.

See `services/cms/BFF.md` and `SECURITY.md` for the broader design notes.
This README only covers the in-tree provider.

## Surface

Decap calls four methods on a backend it doesn't own:

| Method            | Called when                                          |
|-------------------|------------------------------------------------------|
| `authComponent()` | Render the sign-in screen.                           |
| `authenticate(c)` | Decap receives `onLogin(c)` from the auth component. |
| `restoreUser()`   | Cold load: try to restore an existing session.       |
| `logout()`        | User signs out.                                      |

`BrokeredGitHubBackend` extends Decap's `GitHubBackend`, so file, entry, and
commit machinery come from the parent. We override only the auth surface.

## Files

- `index.ts` — re-exports `BrokeredGitHubBackend`.
- `backend.ts` — the Decap backend class. Owns the auth-component cache and
  the silent refresh timer.
- `component.ts` — `makeCmsLogin`. The React sign-in UI plus four `run*(ctx)`
  async functions, one per state with an entry effect.
- `state.ts` — pure state machine: `State`, `Action`, `reducer`,
  `initialState`. No side effects.
- `client.ts` — `probeCmsToken`: the `/auth/app/cms/token` client. Decodes
  JWT #2 and returns a discriminated result (`token` | `link`), or throws
  (`RoleDeniedError` for 403; generic `Error` otherwise).
- `routes.ts` — URL-fragment helpers for the post-OAuth resume flag.

## The state machine

Fresh load (no `#/cms-pending-signin`) starts in `bootstrap`. Post-OAuth
resume starts in `probing`. Both call `probeCmsToken`, but differ in what
they do with each outcome:

| Outcome \ State        | bootstrap    | redirecting (click) | probing (resume)  |
|------------------------|--------------|---------------------|-------------------|
| `kind: 'token'`        | → handingOff | → handingOff        | → handingOff      |
| `kind: 'link'`         | → idle       | navigate to GitHub  | navigate to GitHub|
| throws RoleDeniedError | → error      | → error             | → error           |
| throws other           | → idle       | fresh `signIn.social` | → error         |

The asymmetry on `link` is the "no auto-login" rule: cross-origin navigation
only happens after a user gesture (click or post-OAuth resume), never on bare
mount. Bootstrap can auto-handoff a token because nothing the user can see
changes until Decap takes over.

`handingOff` is terminal: it calls `clearHash()` then `onLogin(...)`, and
Decap takes over.

## Effects

Each in-flight state has a `run*(ctx)` async function in `component.ts`. A
single `useEffect` dispatches on `state.kind`. Adding a new state with side
effects is a three-step change: add to `state.ts`, add a `run*` function,
add one case to the switch.

`ctx.cancelled()` flips on unmount or state change. Effects must check it
before dispatching follow-ups, so a late completion doesn't write to a stale
or gone reducer.

## SSO short-circuit

`runRedirecting` probes before kicking off a fresh OAuth. If a session
already exists (signed in on another tab, or via the Manage UI), we skip
straight to handoff. Without this, every "Sign in" click would create a
new session, because better-auth's `signInSocial` has no session-reuse
semantics.

## Caveats

### Why this isn't published as a plugin

While GitHub recommend token-brokering and it is a proven pattern, there
isn't a clear standard that this adheres to yet, and the architecture may
change to evolve towards one, so it doesn't make sense to contribute as an
open plugin even if that is architecturally cleaner.
