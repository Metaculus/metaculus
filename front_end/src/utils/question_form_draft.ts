import { QuestionDraft } from "@/types/question";

import { cleanupDrafts } from "./drafts";

export const QUESTION_DRAFT_DEBOUNCE_TIME = 3000;
const MAX_QUESTIONS_DRAFT_SIZE_MB = 1.5;
const QUESTION_DRAFT_PREFIX = "question_draft_";

export function getQuestionDraftKey(keyString: string) {
  return `${QUESTION_DRAFT_PREFIX}${keyString}`;
}

export function saveQuestionDraft(
  keyString: string,
  formData: Partial<QuestionDraft>
) {
  const key = getQuestionDraftKey(keyString);
  const draft = {
    ...formData,
    lastModified: Date.now(),
  };
  localStorage.setItem(key, JSON.stringify(draft));
}

export function getQuestionDraft(keyString: string): QuestionDraft | null {
  const key = getQuestionDraftKey(keyString);
  const draft = localStorage.getItem(key);
  return draft ? JSON.parse(draft) : null;
}

export function deleteQuestionDraft(keyString: string) {
  const key = getQuestionDraftKey(keyString);
  localStorage.removeItem(key);
}

export function cleanupQuestionDrafts(maxAgeDays = 14): void {
  cleanupDrafts({
    keyPrefix: QUESTION_DRAFT_PREFIX,
    maxAgeDays,
    maxSizeMB: MAX_QUESTIONS_DRAFT_SIZE_MB,
  });
}
