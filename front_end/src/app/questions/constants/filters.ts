import { QuestionStatus, QuestionType } from "@/types/question";

// TODO: translate these
export const QUESTION_TYPE_LABEL_MAP = {
  [QuestionType.Numeric]: "Numeric",
  [QuestionType.Date]: "Date",
  [QuestionType.MultipleChoice]: "Multiple Choice",
  [QuestionType.Binary]: "Binary",
};

export const QUESTION_STATUS_LABEL_MAP = {
  [QuestionStatus.Active]: "Open",
  [QuestionStatus.Resolved]: "Resolved",
  [QuestionStatus.Closed]: "Closed",
};
