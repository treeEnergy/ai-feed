import { create } from 'zustand';
import type { Person, ScrapedItem, WeeklyTopic, Platform, ViewFilter } from '../types';

interface FeedState {
  persons: Person[];
  items: ScrapedItem[];
  weeklyTopics: WeeklyTopic[];
  selectedPersonId: string | null;
  selectedPlatform: Platform | null;
  viewFilter: ViewFilter;
  scrapeStatus: 'running' | 'idle' | 'error';
  isLoading: boolean;

  selectPerson: (id: string | null) => void;
  selectPlatform: (platform: Platform | null) => void;
  setViewFilter: (filter: ViewFilter) => void;
  toggleItemStar: (itemId: string) => void;
  setScrapeStatus: (status: 'running' | 'idle' | 'error') => void;
  fetchPersons: () => Promise<void>;
  fetchItems: () => Promise<void>;
  fetchWeeklyTopics: () => Promise<void>;
}

export const useFeedStore = create<FeedState>((set, get) => ({
  persons: [],
  items: [],
  weeklyTopics: [],
  selectedPersonId: null,
  selectedPlatform: null,
  viewFilter: 'all',
  scrapeStatus: 'idle',
  isLoading: false,

  selectPerson: (id) => {
    set({ selectedPersonId: id, viewFilter: 'all' });
    get().fetchItems();
  },

  selectPlatform: (platform) => {
    set({ selectedPlatform: platform });
    get().fetchItems();
  },

  setViewFilter: (filter) => {
    set({ viewFilter: filter, selectedPersonId: null });
    get().fetchItems();
  },

  toggleItemStar: async (itemId) => {
    const items = get().items;
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    // Optimistic update
    set({
      items: items.map((i) =>
        i.id === itemId ? { ...i, isStarred: !i.isStarred } : i
      ),
    });

    try {
      await window.electronAPI.invoke('items:toggleStar', itemId);
    } catch {
      // Revert on failure
      set({
        items: items.map((i) =>
          i.id === itemId ? { ...i, isStarred: item.isStarred } : i
        ),
      });
    }
  },

  setScrapeStatus: (status) => set({ scrapeStatus: status }),

  fetchPersons: async () => {
    try {
      const persons = await window.electronAPI.invoke('persons:getAll');
      set({ persons: persons ?? [] });
    } catch {
      set({ persons: [] });
    }
  },

  fetchItems: async () => {
    set({ isLoading: true });
    try {
      const { selectedPersonId, selectedPlatform, viewFilter } = get();
      const filters: Record<string, any> = {};
      if (selectedPersonId) filters.personId = selectedPersonId;
      if (selectedPlatform) filters.platform = selectedPlatform;
      if (viewFilter === 'starred') filters.starred = true;
      if (viewFilter === 'papers') filters.platform = 'arxiv';

      const items = await window.electronAPI.invoke('items:getAll', filters);
      set({ items: items ?? [], isLoading: false });
    } catch {
      set({ items: [], isLoading: false });
    }
  },

  fetchWeeklyTopics: async () => {
    try {
      const topics = await window.electronAPI.invoke('weekly-topics:get');
      set({ weeklyTopics: topics ?? [] });
    } catch {
      set({ weeklyTopics: [] });
    }
  },
}));
