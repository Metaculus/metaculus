import { NotebookIndex } from "@/types/news";

export const AGI_INDEX_SLUG = "agi-readiness-index";

export const NOTEBOOK_INDEXES: NotebookIndex = {
  [AGI_INDEX_SLUG]: [
    { questionId: 3820, weight: 12 },
    { questionId: 28002, weight: 12 },
    { questionId: 27995, weight: 10 },
    { questionId: 27898, weight: 9 },
    { questionId: 27797, weight: 9 },
    { questionId: 27642, weight: 11 },
    { questionId: 28163, weight: -8 },
    { questionId: 27998, weight: 6 },
    { questionId: 27881, weight: 2.5 },
    { questionId: 26961, weight: -1.5 },
  ],
};
