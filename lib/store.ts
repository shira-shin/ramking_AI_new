import { create } from "zustand";

export type RankingItem = {
  candidate: string;
  score: number;
  reason: string;
};

type RankingState = {
  template: string;
  criteria: Record<string, number>;
  candidates: string[];
  results: RankingItem[];
  loading: boolean;
  error: string | null;
  setTemplate: (template: string, criteria: Record<string, number>) => void;
  setCriteria: (criteria: Record<string, number>) => void;
  updateCriterion: (key: string, value: number) => void;
  addCandidate: () => void;
  updateCandidate: (index: number, value: string) => void;
  removeCandidate: (index: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setResults: (results: RankingItem[]) => void;
  resetResults: () => void;
};

const defaultCriteria = {
  clarity: 4,
  creativity: 3,
  impact: 5,
};

export const useRankingStore = create<RankingState>((set) => ({
  template: "balanced",
  criteria: defaultCriteria,
  candidates: ["", ""],
  results: [],
  loading: false,
  error: null,
  setTemplate: (template, criteria) =>
    set({ template, criteria, results: [], error: null }),
  setCriteria: (criteria) => set({ criteria, template: "custom" }),
  updateCriterion: (key, value) =>
    set((state) => ({
      criteria: { ...state.criteria, [key]: value },
      template: "custom",
    })),
  addCandidate: () =>
    set((state) => ({ candidates: [...state.candidates, ""], error: null })),
  updateCandidate: (index, value) =>
    set((state) => {
      const next = [...state.candidates];
      next[index] = value;
      return { candidates: next };
    }),
  removeCandidate: (index) =>
    set((state) => {
      if (state.candidates.length <= 1) {
        return state;
      }
      const next = state.candidates.filter((_, i) => i !== index);
      return { candidates: next };
    }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setResults: (results) => set({ results }),
  resetResults: () => set({ results: [], error: null }),
}));

export const templates: Record<string, { label: string; description: string; criteria: Record<string, number> }> = {
  balanced: {
    label: "Balanced",
    description: "Equal focus on clarity, creativity, and impact.",
    criteria: {
      clarity: 4,
      creativity: 4,
      impact: 4,
    },
  },
  storytelling: {
    label: "Storytelling",
    description: "Higher weight for creativity and narrative strength.",
    criteria: {
      clarity: 3,
      creativity: 5,
      impact: 4,
    },
  },
  data_driven: {
    label: "Data Driven",
    description: "Prioritise clarity and measurable impact.",
    criteria: {
      clarity: 5,
      creativity: 2,
      impact: 5,
    },
  },
};
