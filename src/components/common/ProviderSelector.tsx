import { useTranslation } from 'react-i18next';
import { useState, useRef, useEffect, useCallback } from "react";
import { Icon } from "./Icon";
import { useSettingsStore } from "../../stores/useSettingsStore";

export function ProviderSelector() {
  const { t } = useTranslation();
  const { llmProviders, preferredProviderId, setPreferredProviderId } = useSettingsStore();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 当前有效 Provider：优先使用用户选择，否则使用默认 Provider
  const currentProvider = llmProviders.find((p) => p.id === preferredProviderId)
    || llmProviders.find((p) => p.isDefault)
    || llmProviders[0];

  /* 点击外部关闭下拉框 */
  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
      setOpen(false);
    }
  }, []);

  /* 按 Escape 关闭下拉框 */
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleKeyDown);
      }, 0);
      return () => {
        clearTimeout(timer);
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [open, handleClickOutside, handleKeyDown]);

  const handleSelect = (id: string) => {
    setPreferredProviderId(id);
    setOpen(false);
  };

  // 无 Provider 时不渲染选择器
  if (llmProviders.length === 0) {
    return null;
  }

  return (
    <div ref={containerRef} className="provider-selector-container">
      <div
        role="button"
        aria-label={t('provider.selectModel')}
        tabIndex={0}
        className={`provider-selector-trigger ${open ? "provider-selector-trigger-active" : ""}`}
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen((prev) => !prev); } }}
      >
        <span className="provider-selector-label">{currentProvider?.name ?? t('provider.selectModel')}</span>
        <Icon name={open ? "chevron-up" : "chevron-down"} size={14} />
      </div>

      {open && (
        <div className="provider-selector-dropdown">
          <div className="provider-selector-list">
            {llmProviders.map((provider) => (
              <div
                key={provider.id}
                className={`provider-selector-item ${provider.id === currentProvider?.id ? "provider-selector-item-active" : ""}`}
                onClick={() => handleSelect(provider.id)}
                role="option"
                aria-selected={provider.id === currentProvider?.id}
              >
                <div className="provider-selector-item-info">
                  <span className="provider-selector-item-name">{provider.name}</span>
                  <span className="provider-selector-item-model">{provider.model}</span>
                </div>
                {provider.id === currentProvider?.id && (
                  <Icon name="check" size={14} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .provider-selector-container {
          position: relative;
        }
        .provider-selector-trigger {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 5px 10px;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: background 0.15s;
          font-size: 13px;
          font-weight: 500;
          color: var(--color-text-secondary);
          white-space: nowrap;
          user-select: none;
        }
        .provider-selector-trigger:hover {
          background: var(--color-bg-sub);
        }
        .provider-selector-trigger-active {
          background: var(--color-bg-sub);
          color: var(--color-text-primary);
        }
        .provider-selector-label {
          max-width: 140px;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .provider-selector-dropdown {
          position: absolute;
          top: calc(100% + 6px);
          right: 0;
          min-width: 220px;
          max-width: 300px;
          background: var(--color-bg-elevated);
          border: 1px solid var(--color-border-light);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-lg);
          z-index: 200;
          animation: provider-dropdown-in 0.15s ease-out;
          overflow: hidden;
        }
        @keyframes provider-dropdown-in {
          from {
            opacity: 0;
            transform: scale(0.96) translateY(4px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .provider-selector-list {
          max-height: 280px;
          overflow-y: auto;
          padding: 4px;
        }
        .provider-selector-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding: 8px 10px;
          border-radius: var(--radius-sm);
          cursor: pointer;
        }
        .provider-selector-item:hover {
          background: var(--color-bg-hover);
        }
        .provider-selector-item-active {
          color: var(--color-accent);
        }
        .provider-selector-item-info {
          display: flex;
          flex-direction: column;
          gap: 1px;
          min-width: 0;
          flex: 1;
        }
        .provider-selector-item-name {
          font-size: 13px;
          font-weight: 500;
          color: var(--color-text-primary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .provider-selector-item-model {
          font-size: 11px;
          color: var(--color-text-quaternary);
          font-family: var(--font-mono);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
}
