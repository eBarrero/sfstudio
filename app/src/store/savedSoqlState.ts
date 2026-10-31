import { create } from 'zustand';

interface SavedSoqlState {
  currentId: string | null;
  currentName: string;
  setCurrent: (id: string, name: string) => void;
  clearCurrent: () => void;
}

const savedSoqlState = create<SavedSoqlState>(set => ({
  currentId: null,
  currentName: '',
  setCurrent: (currentId, currentName) => set({ currentId, currentName }),
  clearCurrent: () => set({ currentId: null, currentName: '' }),
}));

export default savedSoqlState;
