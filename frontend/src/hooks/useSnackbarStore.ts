import { create } from "zustand";

export type SnackbarTone = "success" | "error" | "info";

interface SnackbarState {
  text: string | null;
  tone: SnackbarTone;
  sticky: boolean;
  timer: number | null;
  show: (text: string, tone?: SnackbarTone, options?: { sticky?: boolean; durationMs?: number }) => void;
  dismiss: () => void;
}

const DEFAULT_DURATION = 8000;

export const useSnackbarStore = create<SnackbarState>((set, get) => ({
  text: null,
  tone: "info",
  sticky: false,
  timer: null,
  show: (text, tone = "info", options = {}) => {
    const existing = get().timer;
    if (existing) {
      window.clearTimeout(existing);
    }
    const sticky = options.sticky ?? tone === "error";
    let timer: number | null = null;
    if (!sticky) {
      timer = window.setTimeout(() => {
        set({ text: null, timer: null });
      }, options.durationMs ?? DEFAULT_DURATION);
    }
    set({ text, tone, sticky, timer });
  },
  dismiss: () => {
    const existing = get().timer;
    if (existing) {
      window.clearTimeout(existing);
    }
    set({ text: null, timer: null });
  },
}));
