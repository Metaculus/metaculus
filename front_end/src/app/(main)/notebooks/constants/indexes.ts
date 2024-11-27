import { NotebookIndex } from "@/types/news";

export const AGI_INDEX_SLUG = "agi-readiness-index";

export const NOTEBOOK_INDEXES: NotebookIndex = {
  [AGI_INDEX_SLUG]: [
    { questionId: 3820, weight: -2.5 },
    { questionId: 26328, weight: 5 },
    { questionId: 28267, weight: 3.3 },
    { questionId: 28964, weight: 9 },
  ],
};
