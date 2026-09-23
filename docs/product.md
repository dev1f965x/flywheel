# flywheel — product definition

## Problem

Three habits, three apps. The to-do list knows what should be done; the timer knows how
long things took; the routine tracker knows what repeats. None of them knows the others,
so the day is written down three times and measured none.

And the part that keeps a person at a task is often none of those: it is someone noticing.

## Who it is for

Someone who works alone at a desk — studying, building, practising — and wants one place
that holds what to do today, keeps the clock while they do it, and quietly tells their
friends what they are on.

## 1.0.0 scope

One list. Starting something starts the clock; the clock is what the day is made of.

- **Tasks.** Written a line at a time, finished with a tap, renamed in place, and deleted
  with the offer to undo. A task carries the time spent on it today.
- **Routines.** A task can repeat: every day, on chosen weekdays, or every N days.
  Finishing it schedules the next one instead of removing it, and the days it was kept in
  a row are counted.
- **The clock.** Starting a task starts tracking it. One task runs at a time; starting
  another stops the first. Stopping writes a session — start, end, and which task — and
  the running one survives a restart, a reboot, and a closed window.
- **Discord.** While a task runs, the player's Discord shows what they are on and for how
  long. It can be turned off, and it says plainly when Discord is not running.
- **Today.** What was finished, what is left, and how long the day adds up to.
- **Three places.** A page in the browser, a window on Windows, an app on Android, from
  one code base — with Discord on the desktop only, which is where Discord allows it.

## Acceptance criteria

- Starting a task shows it running with the time counting up, and starting another stops
  the first without losing its session.
- A task left running through a restart is still running, with the elapsed time correct.
- A daily routine finished today shows tomorrow's date and a streak of one; finished again
  tomorrow, a streak of two; skipped a day, a streak of zero.
- A routine on chosen weekdays never schedules itself on a day it does not fall on.
- Today's total equals the sum of the day's sessions, and a session that crosses midnight
  is counted on the day each part belongs to.
- With the desktop build running and Discord open, starting a task changes the Discord
  status within a few seconds; stopping clears it.
- With Discord closed, the window says the status is not connected and everything else
  keeps working.
- On the web and Android builds, the Discord setting is absent rather than broken, and the
  window says why.
- Nothing leaves the device: no account, no sync, no analytics.

## Non-goals

- No projects, tags, sub-tasks, priorities, or due times. A flat list and a repeat rule is
  the whole model; the rest is how a to-do app becomes a project manager.
- No accounts, no sync between phone and desktop, no sharing.
- No Discord bot, no posting to channels, and no token: the desktop build talks to the
  Discord app already running on the same machine, which is what Rich Presence is for.
- No charts in 1.0.0. The day's total is a number, not a dashboard.

## Non-functional requirements

- The running clock is right to the second and derived from timestamps, never from a
  counter that a sleeping laptop would miss.
- Opening to a usable list is immediate: everything is local.
- The interface is usable with the keyboard alone, and every state reads as text.
- The web build is a static page that keeps working offline once loaded.

## Roadmap

| Version | Adds |
|---|---|
| 1.0.0 | Tasks, routines, the clock, Discord on the desktop, on web, Windows, and Android |
| 1.1.0 | A week's worth of totals, reordering the list, and editing a session left running |
| later | Tags, if the flat list proves too flat |
