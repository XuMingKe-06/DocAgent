import { useSettingsStore } from "../../stores/useSettingsStore";

export function SkillsTab() {
  const { skills, toggleSkill } = useSettingsStore();

  return (
    <div>
      <div className="text-[13px] font-semibold text-text-secondary uppercase tracking-[.3px] mb-3">内置 Skills</div>

      {skills.map((s) => (
        <div key={s.id} className="flex items-center justify-between py-[10px] border-b border-border-light">
          <div>
            <div className="text-[13px] text-text-primary">{s.name}</div>
            <div className="text-[11px] text-text-tertiary mt-[2px]">{s.description}</div>
          </div>
          <label className="relative inline-block w-9 h-5 cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={s.enabled}
              onChange={() => toggleSkill(s.id)}
            />
            <span className="absolute inset-0 bg-border rounded-[10px] transition-colors duration-200 peer-checked:bg-accent" />
            <span className="absolute top-[2px] left-[2px] w-4 h-4 bg-white rounded-full transition-transform duration-200 peer-checked:translate-x-4" />
          </label>
        </div>
      ))}

      <div className="mt-6">
        <div className="text-[13px] font-semibold text-text-secondary uppercase tracking-[.3px] mb-3">自定义 Skills</div>
        <div className="text-[13px] text-text-tertiary text-center py-4">暂无自定义 Skill，点击下方按钮添加</div>
        <button className="px-[14px] py-[6px] rounded-[var(--radius-sm)] text-[12px] font-medium bg-accent text-white hover:bg-accent-hover transition-all">
          + 添加自定义 Skill
        </button>
      </div>
    </div>
  );
}
