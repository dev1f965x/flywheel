mod presence;

#[cfg(desktop)]
use std::sync::Mutex;

#[cfg(desktop)]
use tauri::{AppHandle, Emitter, State};

#[cfg(desktop)]
use presence::{Doing, Presence};

/// Whether this build can talk to Discord at all (ADR 5).
#[tauri::command]
fn discord_is_possible() -> bool {
    cfg!(desktop)
}

#[cfg(desktop)]
struct Link(Mutex<Option<Presence>>);

/// Opens the connection to the Discord app, and keeps it open, under the given app id.
#[cfg(desktop)]
#[tauri::command]
fn discord_connect(app_id: String, app: AppHandle, link: State<'_, Link>) {
    let handle = app.clone();
    let presence = Presence::start(app_id, move |state| {
        let _ = handle.emit("discord", state);
    });
    *link.0.lock().expect("link") = Some(presence);
}

/// Stops telling Discord anything, and lets go of the connection.
#[cfg(desktop)]
#[tauri::command]
fn discord_disconnect(link: State<'_, Link>) {
    if let Some(presence) = link.0.lock().expect("link").as_ref() {
        presence.clear();
    }
}

#[cfg(desktop)]
#[tauri::command]
fn discord_show(doing: Doing, link: State<'_, Link>) {
    if let Some(presence) = link.0.lock().expect("link").as_ref() {
        presence.show(doing);
    }
}

#[cfg(desktop)]
#[tauri::command]
fn discord_clear(link: State<'_, Link>) {
    if let Some(presence) = link.0.lock().expect("link").as_ref() {
        presence.clear();
    }
}

/// The shell around the page: a window on Windows, an activity on Android, and nothing at
/// all in the browser, where the same page runs on its own (ADR 2).
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default();

    #[cfg(desktop)]
    let builder = builder
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .manage(Link(Mutex::new(None)))
        .invoke_handler(tauri::generate_handler![
            discord_is_possible,
            discord_connect,
            discord_disconnect,
            discord_show,
            discord_clear
        ]);

    #[cfg(not(desktop))]
    let builder = builder.invoke_handler(tauri::generate_handler![discord_is_possible]);

    builder
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
