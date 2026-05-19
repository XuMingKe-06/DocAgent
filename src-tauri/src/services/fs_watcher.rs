use std::path::PathBuf;
use std::sync::Arc;
use std::time::Duration;

use notify::{RecommendedWatcher, RecursiveMode, Watcher, Event, EventKind};
use tauri::{AppHandle, Emitter, Runtime};
use tokio::sync::Mutex;

use crate::events::types::{FILE_CHANGE, FileChangePayload};

/// 文件系统监听服务，监听活动工作区目录变更并发射事件到前端
pub struct FsWatcherService<R: Runtime> {
    app_handle: AppHandle<R>,
    watcher: Arc<Mutex<Option<RecommendedWatcher>>>,
    /// 当前正在监听的工作区 ID 和路径
    active_watch: Arc<Mutex<Option<(String, PathBuf)>>>,
}

impl<R: Runtime> FsWatcherService<R> {
    /// 创建文件监听服务实例
    pub fn new(app_handle: AppHandle<R>) -> Self {
        Self {
            app_handle,
            watcher: Arc::new(Mutex::new(None)),
            active_watch: Arc::new(Mutex::new(None)),
        }
    }

    /// 开始监听指定工作区目录
    pub async fn watch(&self, workspace_id: String, workspace_path: String) {
        let path = PathBuf::from(&workspace_path);
        if !path.exists() || !path.is_dir() {
            log::warn!("FsWatcher: 路径无效或不是目录: {}", workspace_path);
            return;
        }

        // 如果已经在监听同一工作区，跳过
        {
            let active = self.active_watch.lock().await;
            if let Some((ref id, _)) = *active {
                if id == &workspace_id {
                    log::debug!("FsWatcher: 已在监听工作区 {}, 跳过", workspace_id);
                    return;
                }
            }
        }

        let app_handle = self.app_handle.clone();
        let wid = workspace_id.clone();

        // 创建监听器回调
        let callback = move |res: Result<Event, notify::Error>| {
            match res {
                Ok(event) => {
                    let change_type = match event.kind {
                        EventKind::Create(_) => "created",
                        EventKind::Modify(_) => "modified",
                        EventKind::Remove(_) => "deleted",
                        EventKind::Any | EventKind::Other => "modified",
                        _ => return,
                    };

                    // 只处理有路径的事件
                    for path in &event.paths {
                        let path_str = path.to_string_lossy().to_string();
                        log::debug!(
                            "FsWatcher: 检测到文件变更 type={}, path={}",
                            change_type,
                            path_str
                        );

                        let payload = FileChangePayload {
                            workspace_id: wid.clone(),
                            change_type: change_type.to_string(),
                            path: path_str,
                            old_path: None,
                        };

                        let _ = app_handle.emit(FILE_CHANGE, payload);
                    }
                }
                Err(e) => {
                    log::warn!("FsWatcher: 监听错误: {:?}", e);
                }
            }
        };

        // 创建新的监听器
        let mut new_watcher = match RecommendedWatcher::new(callback, notify::Config::default()
            .with_poll_interval(Duration::from_secs(2)))
        {
            Ok(w) => w,
            Err(e) => {
                log::error!("FsWatcher: 创建监听器失败: {:?}", e);
                return;
            }
        };

        // 开始监听目录（递归）
        if let Err(e) = new_watcher.watch(&path, RecursiveMode::Recursive) {
            log::error!("FsWatcher: 启动监听失败: {:?}", e);
            return;
        }

        // 停止旧监听器，保存新监听器
        {
            let mut watcher_guard = self.watcher.lock().await;
            *watcher_guard = Some(new_watcher);
        }
        {
            let mut active_guard = self.active_watch.lock().await;
            *active_guard = Some((workspace_id.clone(), path));
        }

        log::info!("FsWatcher: 开始监听工作区 {} 路径 {}", workspace_id, workspace_path);
    }

    /// 停止监听
    pub async fn stop(&self) {
        let mut watcher_guard = self.watcher.lock().await;
        *watcher_guard = None;
        let mut active_guard = self.active_watch.lock().await;
        *active_guard = None;
        log::info!("FsWatcher: 已停止监听");
    }
}
