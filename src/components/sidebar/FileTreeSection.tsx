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
          className="ft-item group"
          onClick={() => toggleNode(node.path)}
        >
          <span className="ft-icon text-text-tertiary group-hover:text-text-secondary">
            <Icon name="folder" size={16} />
          </span>
          <span className="ft-name">{node.name}</span>
          <span className="ft-chevron transition-transform duration-200" style={{ transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)" }}>
            <Icon name="chevron-down" size={12} />
          </span>
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
      className={`ft-item file-item ${isSelected ? "active" : ""}`}
      onClick={() => selectNode(node.path)}
    >
      <span className={`ft-icon ${
        node.extension === "docx" ? "text-[#2b579a]" :
        node.extension === "xlsx" ? "text-[#217346]" :
        node.extension === "pptx" ? "text-[#b7472a]" :
        node.extension === "pdf" ? "text-[#ea4335]" :
        "text-text-tertiary"
      }`}>
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

  const handleRefresh = () => {
    if (activeWorkspaceId) {
      loadTree(activeWorkspaceId);
    }
  };

  return (
    <SidebarSection title="工作区文件">
      <div className="search-bar">
        <Icon name="search" size={14} className="text-text-quaternary flex-shrink-0" />
        <input
          type="text"
          className="flex-1 text-[12px] placeholder:text-text-quaternary bg-transparent"
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
        <div className="empty-state">
          <Icon name="file" size={24} className="opacity-40" />
          <span>{searchKeyword ? "未找到匹配文件" : "暂无文件"}</span>
        </div>
      ) : (
        <div className="file-tree">
          {filteredTree.map((node) => (
            <FileTreeItem key={node.path} node={node} />
          ))}
        </div>
      )}

      <style>{`
        .search-bar {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 8px;
          margin-bottom: 8px;
          background: var(--color-bg-sub);
          border: 1px solid var(--color-border-light);
          border-radius: var(--radius-sm);
          transition: all 0.2s;
        }
        .search-bar:focus-within {
          border-color: var(--color-accent);
          background: var(--color-bg);
          box-shadow: 0 0 0 2px var(--color-accent-lighter);
        }
        .file-tree {
          font-size: 13px;
        }
        .ft-item {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 5px 8px;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all 0.15s;
          color: var(--color-text-primary);
          position: relative;
        }
        .ft-item:hover {
          background: var(--color-accent-bg);
          color: var(--color-accent);
        }
        .ft-item.active {
          background: var(--color-accent-light);
          color: var(--color-accent);
          font-weight: 500;
        }
        .file-item:hover {
          background: var(--color-accent-bg);
        }
        .ft-icon {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.15s;
        }
        .ft-name {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .ft-chevron {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-text-quaternary);
          transition: all 0.2s;
        }
        .ft-indent {
          padding-left: 20px;
          border-left: 1px solid var(--color-border-light);
          margin-left: 12px;
        }
        .refresh-btn {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-xs);
          color: var(--color-text-quaternary);
          transition: all 0.15s;
          flex-shrink: 0;
          border: none;
          background: none;
          cursor: pointer;
        }
        .refresh-btn:hover {
          color: var(--color-text-primary);
          background: var(--color-bg-hover);
        }
        .refresh-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .refresh-btn.refreshing svg {
          animation: spin 0.8s linear infinite;
        }
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 24px 16px;
          color: var(--color-text-quaternary);
          font-size: 12px;
        }
      `}</style>
    </SidebarSection>
  );
}
