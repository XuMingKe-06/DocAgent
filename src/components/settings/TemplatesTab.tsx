import { useSettingsStore } from "../../stores/useSettingsStore";

export function TemplatesTab() {
  const { templates } = useSettingsStore();

  return (
    <div>
      <div className="text-[13px] font-semibold text-text-secondary uppercase tracking-[.3px] mb-3">内置模板</div>

      {templates.map((tpl) => (
        <div key={tpl.id} className="px-3 py-3 border border-border rounded-[var(--radius-md)] mb-2 cursor-pointer transition-colors duration-150 hover:border-[#D0D3D9]">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-[13px]">{tpl.name}</span>
          </div>
          <div className="text-[11px] text-text-tertiary">{tpl.description}</div>
        </div>
      ))}

      <div className="mt-6">
        <div className="text-[13px] font-semibold text-text-secondary uppercase tracking-[.3px] mb-3">自定义模板</div>
        <div className="text-[13px] text-text-tertiary text-center py-4">暂无自定义模板</div>
        <button className="px-[14px] py-[6px] rounded-[var(--radius-sm)] text-[12px] font-medium bg-accent text-white hover:bg-accent-hover transition-all">
          + 创建模板
        </button>
      </div>
    </div>
  );
}
