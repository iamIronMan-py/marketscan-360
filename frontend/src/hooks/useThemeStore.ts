import { create } from "zustand";

type ThemeMode = "dark" | "light";

interface ThemeState {
  mode: ThemeMode;
  toggle: () => void;
  hydrate: () => void;
}

const storageKey = "marketscan360-theme";

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: "dark",
  toggle: () => {
    const next = get().mode === "dark" ? "light" : "dark";
    localStorage.setItem(storageKey, next);
    set({ mode: next });
  },
  hydrate: () => {
    const stored = localStorage.getItem(storageKey);
    if (stored === "dark" || stored === "light") {
      set({ mode: stored });
    }
  },
}));
