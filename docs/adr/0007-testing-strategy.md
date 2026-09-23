# 7. Testing strategy

Status: accepted
Date: 2026-09-23

## Context

The risky parts are the arithmetic of time — what today adds up to, what a streak is, when
a routine falls next — and the states the window shows. None of them needs a phone, a
window, or Discord to be tested.

## Decision

- **Vitest and Testing Library** for the domain — sessions, totals, routines, streaks —
  and for the window's states, with the clock fixed by the test.
- **Playwright** against the real page for the flows that cross components: write a task,
  start it, stop it, finish a routine, come back tomorrow.
- **Rust tests** for the presence payload, which is the only logic on that side.
- Tests that involve midnight, a month's end, and a sleeping machine are written as
  ordinary cases, not as afterthoughts.
- Every one of them runs in CI on each pull request.

## Consequences

- The clock is a parameter everywhere it is read, so nothing is flaky and nothing waits.
- Discord itself is checked by hand before a release, on a machine with Discord running,
  along with the tray of the installed build and the APK on a phone.
