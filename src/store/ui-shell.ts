import { create } from "zustand";

type UiShellState = {
  mobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;
};

/** Cross-route client UI (mobile shell, sheets). Keeps layout state out of prop drilling. */
export const useUiShellStore = create<UiShellState>((set) => ({
  mobileNavOpen: false,
  setMobileNavOpen: (mobileNavOpen) => set({ mobileNavOpen }),
}));
