import { create } from 'zustand';
import { AristaCredentials, InterfaceConfig, VlanConfig, VxlanConfig } from '../types/arista';
import { apiRequest } from '../lib/utils';

interface SwitchState {
  interfaces: InterfaceConfig[];
  vlans: VlanConfig[];
  vxlan: VxlanConfig | null;
  isLoading: boolean;
  error: string | null;
  fetchInterfaces: () => Promise<void>;
  fetchVlans: () => Promise<void>;
  fetchVxlan: () => Promise<void>;
  updateInterface: (name: string, config: Partial<InterfaceConfig>) => Promise<void>;
  updateVlan: (vlanId: number, config: Partial<VlanConfig>) => Promise<void>;
  updateVxlan: (config: Partial<VxlanConfig>) => Promise<void>;
}

export const useSwitchStore = create<SwitchState>((set, get) => ({
  interfaces: [],
  vlans: [],
  vxlan: null,
  isLoading: false,
  error: null,

  fetchInterfaces: async () => {
    try {
      set({ isLoading: true, error: null });
      const data = await apiRequest('/interfaces');
      set({ interfaces: data, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  fetchVlans: async () => {
    try {
      set({ isLoading: true, error: null });
      const data = await apiRequest('/vlans');
      set({ vlans: data, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  fetchVxlan: async () => {
    try {
      set({ isLoading: true, error: null });
      const data = await apiRequest('/vxlan');
      set({ vxlan: data, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  updateInterface: async (name: string, config: Partial<InterfaceConfig>) => {
    try {
      set({ isLoading: true, error: null });
      await apiRequest(`/interfaces/${name}`, 'PUT', config);
      await get().fetchInterfaces();
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  updateVlan: async (vlanId: number, config: Partial<VlanConfig>) => {
    try {
      set({ isLoading: true, error: null });
      await apiRequest(`/vlans/${vlanId}`, 'PUT', config);
      await get().fetchVlans();
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  updateVxlan: async (config: Partial<VxlanConfig>) => {
    try {
      set({ isLoading: true, error: null });
      await apiRequest('/vxlan', 'PUT', config);
      await get().fetchVxlan();
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },
}));