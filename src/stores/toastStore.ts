import { create } from 'zustand';

export interface ToastItem {
  id: string;
  text: string;
  kind: 'info' | 'success' | 'error';
}

interface ToastState {
  toasts: ToastItem[];
  show: (text: string, kind?: ToastItem['kind']) => void;
  dismiss: (id: string) => void;
}

let counter = 0;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  show: (text, kind = 'info') => {
    counter += 1;
    const id = `t${counter}`;
    set((s) => ({ toasts: [...s.toasts, { id, text, kind }] }));
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** Imperative helper usable outside React (e.g. in the voice agent). */
export const toast = (text: string, kind?: ToastItem['kind']) =>
  useToastStore.getState().show(text, kind);
