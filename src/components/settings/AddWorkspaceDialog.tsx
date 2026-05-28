import { useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { useWorkspaceStore } from "../../stores/useWorkspaceStore";

interface AddWorkspaceDialogProps {
  onClose: () => void;
  onSaved: () => void;
}

export function AddWorkspaceDialog({ onClose, onSaved }: AddWorkspaceDialogProps) {
  const { addWorkspace } = useWorkspaceStore();
  const [name, setName] = useState("");
  const [path, setPath] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /* 追踪名称是否由用户手动修改，用于判断选择新目录时是否自动更新名称 */
  const [nameUserModified, setNameUserModified] = useState(false);

  const handleBrowse = async () => {
    setError(null);
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: "选择工作区目录",
      });
      if (selected) {
        setPath(selected);
        /* 只有用户未手动修改名称时，才自动更新为新目录名 */
        if (!nameUserModified) {
          const dirName = selected.split(/[/\\]/).filter(Boolean).pop() || "";
          setName(dirName);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : typeof err === "string" ? err : "打开目录选择器失败";
      setError(msg);
    }
  };

  const handleSave = async () => {
    if (!path.trim()) {
      setError("请选择工作区目录");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await addWorkspace(path.trim(), name.trim() || undefined);
      onSaved();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : typeof err === "string" ? err : "添加工作区失败";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-overlay z-[400] flex items-center justify-center animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="dialog-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-header">
          <h3 className="dialog-title">添加工作区</h3>
          <button className="dialog-close-btn" onClick={onClose}>x</button>
        </div>

        <div className="dialog-body">
          <div className="form-group">
            <label className="form-label">工作区路径 *</label>
            <div className="path-input-group">
              <input
                className="form-input path-input"
                placeholder={'点击「浏览」选择目录...'}
                value={path}
                readOnly
              />
              <button
                className="browse-btn"
                onClick={handleBrowse}
              >
                浏览
              </button>
            </div>
            <div className="form-hint">Agent 将在此目录下操作文档文件</div>
          </div>

          <div className="form-group">
            <label className="form-label">工作区名称（可选）</label>
            <input
              className="form-input"
              placeholder="留空则使用目录名"
              value={name}
              onChange={(e) => { setName(e.target.value); setNameUserModified(true); }}
            />
          </div>

          {error && (
            <div className="test-result test-error">{error}</div>
          )}
        </div>

        <div className="dialog-footer">
          <button className="dialog-btn dialog-btn-ghost" onClick={onClose}>取消</button>
          <button className="dialog-btn dialog-btn-primary" onClick={handleSave} disabled={saving || !path}>
            {saving ? "添加中..." : "添加"}
          </button>
        </div>
      </div>

      <style>{`
        .dialog-modal {
          width: 480px;
          background: var(--color-bg-elevated);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-xl);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: scaleIn 0.2s ease;
        }
        .dialog-header {
          padding: 18px 24px;
          border-bottom: 1px solid var(--color-border-light);
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }
        .dialog-title {
          font-size: 15px;
          font-weight: 700;
          color: var(--color-text-primary);
          flex: 1;
        }
        .dialog-close-btn {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-sm);
          color: var(--color-text-secondary);
          transition: all 0.15s;
          font-size: 16px;
        }
        .dialog-close-btn:hover {
          background: var(--color-bg-sub);
          color: var(--color-text-primary);
        }
        .dialog-body {
          flex: 1;
          overflow-y: auto;
          padding: 20px 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .form-label {
          font-size: 12px;
          font-weight: 500;
          color: var(--color-text-secondary);
        }
        .form-input {
          padding: 8px 12px;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          font-size: 13px;
          transition: all 0.2s;
          background: var(--color-bg);
          color: var(--color-text-primary);
        }
        .form-input:focus {
          border-color: var(--color-accent);
          box-shadow: 0 0 0 2px var(--color-accent-lighter);
          outline: none;
        }
        .path-input-group {
          display: flex;
          gap: 8px;
        }
        .path-input {
          flex: 1;
          background: var(--color-bg-sub);
        }
        .browse-btn {
          padding: 8px 16px;
          border-radius: var(--radius-sm);
          font-size: 12px;
          font-weight: 500;
          background: var(--color-accent);
          color: white;
          border: none;
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .browse-btn:hover {
          background: var(--color-accent-hover);
        }
        .form-hint {
          font-size: 11px;
          color: var(--color-text-quaternary);
        }
        .test-result {
          padding: 8px 12px;
          border-radius: var(--radius-sm);
          font-size: 12px;
        }
        .test-error {
          background: var(--color-error-light);
          color: var(--color-error);
          border: 1px solid rgba(245, 74, 69, 0.3);
        }
        .dialog-footer {
          padding: 16px 24px;
          border-top: 1px solid var(--color-border-light);
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }
        .dialog-btn {
          padding: 6px 16px;
          border-radius: var(--radius-sm);
          font-size: 12px;
          font-weight: 500;
          border: none;
          cursor: pointer;
          transition: all 0.15s;
        }
        .dialog-btn-primary {
          background: var(--color-accent);
          color: white;
        }
        .dialog-btn-primary:hover:not(:disabled) {
          background: var(--color-accent-hover);
        }
        .dialog-btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .dialog-btn-ghost {
          background: var(--color-bg-sub);
          color: var(--color-text-secondary);
        }
        .dialog-btn-ghost:hover {
          background: var(--color-bg-hover);
        }
      `}</style>
    </div>
  );
}
