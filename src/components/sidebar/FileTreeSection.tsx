import { useFileTreeStore } from "../../stores/useFileTreeStore";
import { Icon } from "../common/Icon";
import { SidebarSection } from "../layout/Sidebar";
import type { FileNode } from "../../types";

function FileTreeItem({ node, depth = 0 }: { node: FileNode; depth?: number }) {
  const { expandedKeys, selectedKey, toggleNode, selectNode } = useFileTreeStore();
  const isExpanded = expandedKeys.has(node.path);
  const isSelected = selectedKey === node.path;

  if (node.isDir) {
    return (
      <div>
        <div
          className="ft-item"
          onClick={() => toggleNode(node.path)}
        >
          <span className="ft-icon">
            <Icon name="folder" size={16} />
          </span>
          <span className="ft-name">{node.name}</span>
        </div>
        {isExpanded && node.children && (
          <div className="ft-indent">
            {node.children.map((child) => (
              <FileTreeItem key={child.path} node={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`ft-item ${isSelected ? "active" : ""}`}
      onClick={() => selectNode(node.path)}
    >
      <span className="ft-icon">
        {node.extension === "docx" ? <Icon name="doc" size={16} /> :
         node.extension === "xlsx" ? <Icon name="xlsx" size={16} /> :
         node.extension === "pptx" ? <Icon name="ppt" size={16} /> :
         node.extension === "pdf" ? <Icon name="pdf" size={16} /> :
         <Icon name="file" size={16} />}
      </span>
      <span className="ft-name">{node.name}</span>
    </div>
  );
}

export function FileTreeSection() {
  const { searchKeyword, setSearchKeyword, getFilteredTree, loadTree, isLoading, activeWorkspaceId } = useFileTreeStore();
  const filteredTree = getFilteredTree();

  // 手动刷新文件树
  const handleRefresh = () => {
    if (activeWorkspaceId) {
      loadTree(activeWorkspaceId);
    }
  };

  return (
    <SidebarSection title="工作区文件">
      <div className="flex items-center gap-[6px] px-2 py-[6px] mb-[6px] bg-bg border border-border rounded-[var(--radius-sm)]">
        <Icon name="search" size={14} className="text-text-tertiary flex-shrink-0" />
        <input
          type="text"
          className="flex-1 text-[12px] placeholder:text-text-tertiary bg-transparent"
          placeholder="搜索文件..."
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
        />
        <button
          className={`refresh-btn ${isLoading ? "refreshing" : ""}`}
          onClick={handleRefresh}
          title="刷新文件树"
          disabled={isLoading}
        >
          <Icon name="refresh" size={14} />
        </button>
      </div>

      {filteredTree.length === 0 ? (
        <div className="text-[13px] text-text-tertiary text-center py-4">
          {searchKeyword ? "未找到匹配文件" : "暂无文件"}
        </div>
      ) : (
        <div className="file-tree">
          {filteredTree.map((node) => (
            <FileTreeItem key={node.path} node={node} />
          ))}
        </div>
      )}

      <style>{`
        .file-tree { font-size: 13px; }
        .ft-item {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 8px;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: background 0.1s;
          color: var(--color-text-primary);
        }
        .ft-item:hover { background: rgba(0,0,0,0.04); }
        .ft-item.active { background: var(--color-accent-light); color: var(--color-accent); }
        .ft-icon { width: 16px; height: 16px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
        .ft-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .ft-indent { padding-left: 20px; }
        .refresh-btn {
          width: 22px; height: 22px; display: flex; align-items: center; justify-content: center;
          border-radius: var(--radius-sm); color: var(--color-text-tertiary);
          transition: color 0.15s, background 0.15s; flex-shrink: 0; border: none; background: none; cursor: pointer;
        }
        .refresh-btn:hover { color: var(--color-text-primary); background: var(--color-bg-sub); }
        .refresh-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .refresh-btn.refreshing svg { animation: spin 0.8s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </SidebarSection>
  );
}
