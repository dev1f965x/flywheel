# 4. Keep time as instants, and count from them

Status: accepted
Date: 2026-09-23

## Context

A task that is running has to show the time counting up, keep counting while the window is
closed, and be right after a laptop sleeps for three hours or a machine is rebooted.

## Options

- **A counter ticked by a timer.** Adds a second every second. It goes wrong as soon as
  the page is hidden, the laptop sleeps, or the tab is throttled, which browsers do to
  background timers deliberately.
- **A duration saved every few seconds.** Survives a crash to within a few seconds, and
  writes constantly for something that can be derived.
- **The instant it started.** Store when the task was started; the elapsed time is the
  difference from now, computed whenever the screen redraws.

## Decision

A running task is an instant: `startedAt`. A finished stretch of work is a session with a
start and an end. Everything on screen — the running clock, today's total, a streak — is
derived from those instants, in the machine's own time zone.

## Consequences

- Sleep, a closed window and a reboot make no difference; the elapsed time is still correct.
- A session that crosses midnight belongs to both days, and is split when a day's total is
  worked out rather than when it is written.
- Changing the machine's clock moves the numbers, which is the honest answer for a tool
  that measures the machine's day.
