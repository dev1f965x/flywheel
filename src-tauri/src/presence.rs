//! What the desktop build tells Discord (ADR 5).
//!
//! Rich Presence is a local conversation with the Discord app on the same machine: no
//! token, no network of ours, and nothing at all where Discord does not run.

use serde::Serialize;

/// What is being worked on, as the window hands it over.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Doing {
    pub task: String,
    /// When the stretch started, in milliseconds since the epoch, so Discord counts up.
    pub started_at: i64,
}

/// How the connection to the Discord app stands, as the window shows it.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum Link {
    /// Discord is not running, or has not accepted the connection yet.
    Waiting,
    /// Connected, and saying whatever it was last told.
    Connected,
}

/// The two lines Discord shows, worked out from what is being done.
pub fn lines(doing: &Doing) -> (String, String) {
    let task = doing.task.trim();
    let details = if task.is_empty() {
        "무언가 하는 중".to_string()
    } else {
        task.to_string()
    };
    (details, "flywheel".to_string())
}

#[cfg(not(any(target_os = "android", target_os = "ios")))]
pub use desktop::Presence;

#[cfg(not(any(target_os = "android", target_os = "ios")))]
mod desktop {
    use std::sync::mpsc::{channel, Sender};
    use std::sync::{Arc, Mutex};
    use std::time::Duration;

    use discord_rich_presence::activity::{Activity, Timestamps};
    use discord_rich_presence::{DiscordIpc, DiscordIpcClient};

    use super::{lines, Doing, Link};

    /// How long to wait before knocking on Discord's door again.
    const RETRY: Duration = Duration::from_secs(15);

    enum Wish {
        Show(Doing),
        Clear,
    }

    /// Keeps one connection to the Discord app, and says what it is told to say.
    pub struct Presence {
        wishes: Sender<Wish>,
        wanted: Arc<Mutex<Option<Doing>>>,
    }

    impl Presence {
        /// Starts the thread that owns the connection. `report` hears every change of state.
        pub fn start(app_id: String, report: impl Fn(Link) + Send + 'static) -> Self {
            let (wishes, asked) = channel::<Wish>();
            let wanted: Arc<Mutex<Option<Doing>>> = Arc::new(Mutex::new(None));
            let held = wanted.clone();

            std::thread::spawn(move || {
                // A client that cannot even be built means an id nobody can use; the
                // window is told it is waiting, which is what it looks like from there.
                let Ok(mut client) = DiscordIpcClient::new(&app_id) else {
                    report(Link::Waiting);
                    return;
                };
                let mut linked = false;
                let mut told: Option<Link> = None;

                loop {
                    // Anything the window asked for while we were not connected is still
                    // in `wanted`, so reconnecting says the right thing straight away.
                    while let Ok(wish) = asked.try_recv() {
                        *held.lock().expect("wanted") = match wish {
                            Wish::Show(doing) => Some(doing),
                            Wish::Clear => None,
                        };
                    }

                    if !linked {
                        linked = client.connect().is_ok();
                    }

                    if linked {
                        let doing = held.lock().expect("wanted").clone();
                        let said = match &doing {
                            Some(doing) => say(&mut client, doing),
                            None => client.clear_activity().is_ok(),
                        };
                        if !said {
                            linked = false;
                        }
                    }

                    let now = if linked {
                        Link::Connected
                    } else {
                        Link::Waiting
                    };
                    if told != Some(now) {
                        told = Some(now);
                        report(now);
                    }

                    std::thread::sleep(if linked {
                        Duration::from_secs(2)
                    } else {
                        RETRY
                    });
                }
            });

            Self { wishes, wanted }
        }

        pub fn show(&self, doing: Doing) {
            *self.wanted.lock().expect("wanted") = Some(doing.clone());
            let _ = self.wishes.send(Wish::Show(doing));
        }

        pub fn clear(&self) {
            *self.wanted.lock().expect("wanted") = None;
            let _ = self.wishes.send(Wish::Clear);
        }
    }

    fn say(client: &mut DiscordIpcClient, doing: &Doing) -> bool {
        let (details, state) = lines(doing);
        let activity = Activity::new()
            .details(&details)
            .state(&state)
            .timestamps(Timestamps::new().start(doing.started_at / 1000));

        client.set_activity(activity).is_ok()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn says_the_task_being_worked_on() {
        let doing = Doing {
            task: "논문 읽기".into(),
            started_at: 1_700_000_000_000,
        };

        assert_eq!(lines(&doing), ("논문 읽기".into(), "flywheel".into()));
    }

    #[test]
    fn a_nameless_task_still_says_something() {
        let doing = Doing {
            task: "   ".into(),
            started_at: 0,
        };

        assert_eq!(lines(&doing).0, "무언가 하는 중");
    }
}
