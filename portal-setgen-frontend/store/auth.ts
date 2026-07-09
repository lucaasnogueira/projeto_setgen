import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  updateUser: (partial: Partial<User>) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => {
        set({ user, token });
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        // Salvar também em cookie para o middleware/proxy
        document.cookie = `auth-storage=${token}; path=/; max-age=86400; SameSite=Lax`;
      },
      updateUser: (partial) => {
        set((state) => {
          if (!state.user) return state;
          const user = { ...state.user, ...partial };
          localStorage.setItem('user', JSON.stringify(user));
          return { user };
        });
      },
      clearAuth: () => {
        set({ user: null, token: null });
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Limpar cookie
        document.cookie = 'auth-storage=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
