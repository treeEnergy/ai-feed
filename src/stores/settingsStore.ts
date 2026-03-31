import { create } from 'zustand';
import type { AppSettings } from '../types';

interface SettingsState {
  settings: AppSettings;
  isLoaded: boolean;
  fetchSettings: () => Promise<void>;
  updateSettings: (patch: Partial<AppSettings>) => Promise<void>;
}

const defaultSettings: AppSettings = {
  deepseekApiKey: '',
  scrapeInterval: '1h',
  proxyUrl: '',
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: defaultSettings,
  isLoaded: false,

  fetchSettings: async () => {
    try {
      const settings = await window.electronAPI.invoke('settings:get');
      set({ settings: settings ?? defaultSettings, isLoaded: true });
    } catch {
      set({ isLoaded: true });
    }
  },

  updateSettings: async (patch) => {
    const merged = { ...get().settings, ...patch };
    set({ settings: merged });
    try {
      await window.electronAPI.invoke('settings:update', merged);
    } catch {
      // silent
    }
  },
}));
