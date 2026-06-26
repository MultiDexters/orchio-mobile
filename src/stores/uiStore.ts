import { create } from 'zustand';

interface UiState {
  commandsOpen: boolean;
  openCommands: () => void;
  closeCommands: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  commandsOpen: false,
  openCommands: () => set({ commandsOpen: true }),
  closeCommands: () => set({ commandsOpen: false }),
}));
