# 5. Show Discord through Rich Presence, on the desktop only

Status: accepted
Date: 2026-09-23

## Context

The Discord part exists so that friends see what someone is working on. Discord offers
more than one way for an outside program to report that, and they differ considerably.

## Options

- **Rich Presence.** The Discord app running on the same machine accepts a local
  connection over a named pipe or a socket and shows what it is told, with the app's own
  name and the time it started. It is the supported path, needs no token, and works only
  where the Discord app itself runs — so not in a browser tab, and not on a phone.
- **The account's own token.** A program impersonates the person's Discord client. It
  would work from anywhere, including a phone, but it breaks Discord's terms and results
  in banned accounts.
- **A bot posting to a channel.** A different mechanism: it needs a server, a bot and an
  invite, and it writes messages into a channel rather than setting a status.

## Decision

Rich Presence, spoken from the Rust side of the desktop build with the
`discord-rich-presence` crate, and compiled out everywhere else. The web and Android
builds have no Discord setting at all, and say why where a person would look for it.

## Consequences

- Nothing is sent anywhere: the connection is to a program already on the machine.
- Discord being closed is an ordinary state, not an error. The connection is retried and
  the window shows whether it is connected.
- The status carries the task's name and when it started, so Discord counts the time up on
  its own.
- A phone cannot show a Discord status, and that is a limit of the platform, stated in the
  app rather than worked around.
