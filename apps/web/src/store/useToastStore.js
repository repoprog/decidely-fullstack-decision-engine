import { create } from "zustand";

const createToastId = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;

export const useToastStore = create((set) => ({
  toasts: [],

  addToast: (message, type = "info", duration = 3000) => {
    const id = createToastId();

    set((state) => ({
      toasts: [...state.toasts, { id, message, type, duration }],
    }));
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }));
  },
}));
