# 6. Keep everything on the device

Status: accepted
Date: 2026-09-23

## Context

The app holds a list someone wrote for themselves and the hours they spent. It runs in a
browser tab, a desktop window, and a phone app, and the same code has to store them in all
three.

## Options

- **An account and a server.** The list follows the person between devices, and the app
  grows a backend, a login, a privacy policy, and a bill — to hold a to-do list.
- **A database through a Tauri plugin.** Right for the installed builds, absent in the
  browser, so the web build would need a second implementation of everything.
- **`localStorage`.** Present in all three, and enough for a few years of a person's own
  tasks and sessions, which are a few hundred kilobytes of text.

## Decision

`localStorage`, under one key per kind of thing, read defensively so that anything
unreadable falls back to an empty list rather than an empty screen.

## Consequences

- Nothing about the person leaves the machine, so the privacy line in the product
  definition holds without qualification.
- The list does not follow the person from the phone to the desktop, which is the price.
- Sessions accumulate; a year of them is small, and a later version can fold old ones into
  daily totals if it ever stops being true.
