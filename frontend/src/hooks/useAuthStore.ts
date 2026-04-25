import { create } from "zustand";

const tokenKey = "marketscan360-auth-token";
const userKey = "marketscan360-auth-user";

interface AuthUser {
  email: string;
  fullName: string;
  isVerified: boolean;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  hydrate: () => void;
  setSession: (token: string, user: AuthUser) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  hydrate: () => {
    const token = localStorage.getItem(tokenKey);
    const user = localStorage.getItem(userKey);
    set({
      token,
      user: user ? (JSON.parse(user) as AuthUser) : null,
    });
  },
  setSession: (token, user) => {
    localStorage.setItem(tokenKey, token);
    localStorage.setItem(userKey, JSON.stringify(user));
    set({ token, user });
  },
  clearSession: () => {
    localStorage.removeItem(tokenKey);
    localStorage.removeItem(userKey);
    set({ token: null, user: null });
  },
}));

export function getAuthToken() {
  return localStorage.getItem(tokenKey);
}
