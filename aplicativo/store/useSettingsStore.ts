import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { zustandStorage } from '../utils/storage';

export type ThemeMode = 'light' | 'dark' | 'system';
export type Language = 'pt-BR' | 'en' | 'es';

interface SettingsState {
  theme: ThemeMode;
  language: Language;
  isBiometryEnabled: boolean;
  setTheme: (theme: ThemeMode) => void;
  setLanguage: (language: Language) => void;
  setBiometryEnabled: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'light',
      language: 'pt-BR',
      isBiometryEnabled: false,
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      setBiometryEnabled: (enabled) => set({ isBiometryEnabled: enabled }),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);
