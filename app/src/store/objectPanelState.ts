import { create } from 'zustand';

export type ObjectPanelTab = 'fields' | 'relations' | 'where';

interface ObjectPanelState {
  activeTab: ObjectPanelTab;
  selectTab: (tab: ObjectPanelTab) => void;
  resetTab: () => void;
}

const objectPanelState = create<ObjectPanelState>(set => ({
  activeTab: 'fields',
  selectTab: activeTab => set({ activeTab }),
  resetTab: () => set({ activeTab: 'fields' }),
}));

export default objectPanelState;
