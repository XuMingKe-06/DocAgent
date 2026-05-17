pub mod commands;
pub mod config;
pub mod db;
pub mod services;
pub mod utils;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("你好，{}！欢迎使用 DocAgent", name)
}

pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
