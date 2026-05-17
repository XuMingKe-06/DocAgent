import { useWorkspaceStore } from "../../stores/useWorkspaceStore";

export function WorkspaceTab() {
  const { workspaces, currentWorkspaceId } = useWorkspaceStore();

  return (
    <div>
      <div className="text-[13px] font-semibold text-text-secondary uppercase tracking-[.3px] mb-3">工作区列表</div>

      {workspaces.map((ws) => (
        <div key={ws.id} className="px-3 py-3 border border-border rounded-[var(--radius-md)] mb-2 transition-colors duration-150 hover:border-[#D0D3D9]">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold text-[13px]">{ws.name}</span>
            {ws.id === currentWorkspaceId && (
              <span className="text-[11px] text-success">当前</span>
            )}
          </div>
          <div className="font-mono text-[11px] text-text-tertiary">
            {ws.path} &nbsp;|&nbsp; 创建于 {new Date(ws.createdAt).toLocaleDateString("zh-CN")}
          </div>
        </div>
      ))}

      <button className="mt-2 px-[14px] py-[6px] rounded-[var(--radius-sm)] text-[12px] font-medium bg-accent text-white hover:bg-accent-hover transition-all">
        + 添加工作区
      </button>
    </div>
  );
}
