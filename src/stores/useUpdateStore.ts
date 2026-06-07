import { create } from 'zustand'

/** 更新 store 的状态接口 */
interface UpdateState {
  /** 待安装的更新对象引用（来自 @tauri-apps/plugin-updater 的 Update 实例） */
  pendingUpdate: any | null
  /** 设置待安装的更新 */
  setPendingUpdate: (update: any) => void
  /** 清除待安装的更新 */
  clearPendingUpdate: () => void
}

/** 应用更新全局状态 store，管理"稍后重启"场景下的待安装更新引用 */
export const useUpdateStore = create<UpdateState>((set) => ({
  pendingUpdate: null,

  // 设置待安装的更新
  setPendingUpdate: (update: any) => {
    set({ pendingUpdate: update })
  },

  // 清除待安装的更新
  clearPendingUpdate: () => {
    set({ pendingUpdate: null })
  },
}))
