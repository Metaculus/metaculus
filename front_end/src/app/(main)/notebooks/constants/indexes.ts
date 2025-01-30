import { NotebookIndex } from "@/types/news";

export const AGI_INDEX_SLUG = "agi-readiness-index";

export const NOTEBOOK_INDEXES: NotebookIndex = {
  [AGI_INDEX_SLUG]: [
    { questionId: 31688, weight: -12 },
    { questionId: 31689, weight: 12 },
    { questionId: 31707, weight: 10 },
    { questionId: 34453, weight: 9 },
    // { postId: 27797, weight: 9 }, // currently missing on prod
    { questionId: 31710, weight: 11 },
    { questionId: 31711, weight: -8 },
    { questionId: 31712, weight: 6 },
  ],
};
