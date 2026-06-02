import { create } from 'zustand'

export type NetworkStatus = 'online' | 'offline'

interface NetworkStore {
  status: NetworkStatus
  previousStatus: NetworkStatus
  setStatus: (status: NetworkStatus) => void
  getStatus: () => NetworkStatus
  isOnline: () => boolean
}

export const useNetworkStore = create<NetworkStore>((set, get) => ({
  status: 'online',
  previousStatus: 'online',
  
  setStatus: (status: NetworkStatus) => {
    const currentStatus = get().status
    set({ 
      status, 
      previousStatus: currentStatus 
    })
  },
  
  getStatus: () => get().status,
  
  isOnline: () => get().status === 'online',
}))