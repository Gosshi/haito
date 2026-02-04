'use client';

import { create } from 'zustand';

import type {
  RoadmapHistoryCreateRequest,
  RoadmapHistoryDetail,
  RoadmapHistoryErrorType,
  RoadmapHistoryListItem,
  RoadmapHistoryResult,
} from '../lib/roadmap-history/types';
import {
  createRoadmapHistory,
  fetchRoadmapHistoryDetail,
  fetchRoadmapHistoryList,
} from '../lib/api/roadmap-history';
import { pushToast } from './toast-store';

export type RoadmapHistoryError = {
  type: RoadmapHistoryErrorType;
  message: string;
};

export type RoadmapHistoryState = {
  items: RoadmapHistoryListItem[];
  selectedId: string | null;
  selectedDetail: RoadmapHistoryDetail | null;
  detailsById: Record<string, RoadmapHistoryDetail>;
  compareSelection: string[];
  isLoading: boolean;
  error: RoadmapHistoryError | null;
  fetchHistoryList: (limit?: number) => Promise<RoadmapHistoryResult<RoadmapHistoryListItem[]>>;
  selectHistory: (id: string) => Promise<RoadmapHistoryResult<RoadmapHistoryDetail>>;
  toggleCompareSelection: (id: string) => void;
  clearCompareSelection: () => void;
  saveHistory: (payload: RoadmapHistoryCreateRequest) => Promise<RoadmapHistoryResult<RoadmapHistoryDetail>>;
};

let latestSaveRequestId = 0;

export const useRoadmapHistoryStore = create<RoadmapHistoryState>((set, get) => ({
  items: [],
  selectedId: null,
  selectedDetail: null,
  detailsById: {},
  compareSelection: [],
  isLoading: false,
  error: null,
  fetchHistoryList: async (limit) => {
    set({ isLoading: true, error: null });

    const result = await fetchRoadmapHistoryList(limit);

    if (!result.ok) {
      set({ isLoading: false, error: result.error });
      return result;
    }

    set({ items: result.data, isLoading: false, error: null });
    return result;
  },
  selectHistory: async (id) => {
    set({ selectedId: id, isLoading: true, error: null });

    const cached = get().detailsById[id];
    if (cached) {
      set({ selectedDetail: cached, isLoading: false, error: null });
      return { ok: true, data: cached };
    }

    const result = await fetchRoadmapHistoryDetail(id);

    if (!result.ok) {
      set({ selectedDetail: null, isLoading: false, error: result.error });
      return result;
    }

    set((state) => ({
      selectedDetail: result.data,
      detailsById: { ...state.detailsById, [id]: result.data },
      isLoading: false,
      error: null,
    }));

    return result;
  },
  toggleCompareSelection: (id) => {
    const exists = get().compareSelection.includes(id);
    set((state) => ({
      compareSelection: exists
        ? state.compareSelection.filter((item) => item !== id)
        : [...state.compareSelection, id],
    }));

    if (!exists && !get().detailsById[id]) {
      void fetchRoadmapHistoryDetail(id).then((result) => {
        if (!result.ok) {
          return;
        }
        set((state) => ({
          detailsById: { ...state.detailsById, [id]: result.data },
        }));
      });
    }
  },
  clearCompareSelection: () => set({ compareSelection: [] }),
  saveHistory: async (payload) => {
    const requestId = (latestSaveRequestId += 1);
    const result = await createRoadmapHistory(payload);

    if (requestId !== latestSaveRequestId) {
      return result;
    }

    if (!result.ok) {
      const type = result.error.type;
      const message =
        type === 'unauthorized'
          ? 'ログインが必要です。履歴を保存できませんでした。'
          : type === 'validation'
            ? '入力内容を確認してください。履歴を保存できませんでした。'
            : '履歴の保存に失敗しました。';
      set({ error: result.error });
      pushToast(message, 'error');
      return result;
    }

    set((state) => ({
      items: [
        result.data,
        ...state.items.filter((item) => item.id !== result.data.id),
      ],
      detailsById: {
        ...state.detailsById,
        [result.data.id]: result.data,
      },
    }));

    return result;
  },
}));
