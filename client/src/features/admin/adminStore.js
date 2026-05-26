import { create } from 'zustand';

export const useAdminStore = create((set, get) => ({
  token: null,
  user: null,
  activeTab: 'orders',

  isAuthed: () => !!get().token,

  setSession: ({ token, user }) => set({ token, user }),

  logout: () => set({ token: null, user: null, activeTab: 'orders' }),

  setActiveTab: (tab) => set({ activeTab: tab }),
}));
