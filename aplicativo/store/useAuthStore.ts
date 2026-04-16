import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { zustandStorage } from '../utils/storage';

interface User {
  id: string;
  re?: string;
  name: string;
  email: string;
  pessoaId: number;
  empresaId: number;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loginMethod: 'facial' | 'credentials' | null;
  isEnrolled: boolean;
  login: (user: User, method: 'facial' | 'credentials') => void;
  setEnrolled: (status: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      loginMethod: null,
      isEnrolled: false,
      login: (user, method) => set({ user, isAuthenticated: true, loginMethod: method }),
      setEnrolled: (status) => set({ isEnrolled: status }),
      logout: () => {
        set({ user: null, isAuthenticated: false, loginMethod: null });
        // Limpar os registros vinculados à sessão anterior para isolamento de dados
        try {
          const { useTimeTrackingStore } = require('./useTimeTrackingStore');
          useTimeTrackingStore.getState().clearRecords();
        } catch (e) {
          console.error('Erro ao limpar registros no logout:', e);
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);
