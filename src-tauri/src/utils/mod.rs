pub mod logger;

use std::path::PathBuf;

/// 跨平台路径规范化函数
/// 在 Windows 上，std::fs::canonicalize() 会返回 UNC 路径（\\?\C:\...），
/// 这会导致路径比较失败和 Python Sidecar 无法正确处理路径。
/// 使用 dunce::canonicalize() 在 Windows 上去除 UNC 前缀，其他平台保持原行为。
pub fn canonicalize(path: impl AsRef<std::path::Path>) -> std::io::Result<PathBuf> {
    dunce::canonicalize(path.as_ref())
}
