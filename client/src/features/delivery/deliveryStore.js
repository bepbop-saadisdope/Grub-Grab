import { create } from 'zustand';

export const useDeliveryStore = create((set, get) => ({
  token: null,
  user: null,
  view: 'active', // 'active' | 'all'

  isAuthed: () => !!get().token,
  setSession: ({ token, user }) => set({ token, user }),
  logout: () => set({ token: null, user: null, view: 'active' }),
  setView: (v) => set({ view: v }),
}));
