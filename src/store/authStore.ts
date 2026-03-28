import { create } from 'zustand';
import { User } from './mockData';

interface AuthState {
  user: User | null;
  login: (username: string) => Promise<boolean>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  login: async (username: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      set({ user: data.user });
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  },
  logout: () => set({ user: null }),
}));
