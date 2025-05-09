import { QuestionDraft } from "@/types/question";

import { cleanupDrafts } from ".";

export const QUESTION_DRAFT_DEBOUNCE_TIME = 3000;
const QUESTION_DRAFT_PREFIX = "question_draft_";
const MAX_QUESTIONS_DRAFT_SIZE_MB = 1.5;

export function getQuestionDraftKey(questionType: string) {
  return `${QUESTION_DRAFT_PREFIX}${questionType}`;
}

export function saveQuestionDraft(
  questionType: string,
  formData: Partial<QuestionDraft>
) {
  const key = getQuestionDraftKey(questionType);
  const draft = {
    ...formData,
    lastModified: Date.now(),
  };
  localStorage.setItem(key, JSON.stringify(draft));
}

export function getQuestionDraft(questionType: string): QuestionDraft | null {
  const key = getQuestionDraftKey(questionType);
  const draft = localStorage.getItem(key);
  return draft ? JSON.parse(draft) : null;
}

export function deleteQuestionDraft(questionType: string) {
  const key = getQuestionDraftKey(questionType);
  localStorage.removeItem(key);
}

export function cleanupQuestionDrafts(maxAgeDays = 14): void {
  cleanupDrafts({
    keyPrefix: QUESTION_DRAFT_PREFIX,
    maxAgeDays,
    maxSizeMB: MAX_QUESTIONS_DRAFT_SIZE_MB,
  });
}
