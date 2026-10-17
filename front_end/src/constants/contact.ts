export const ContactSubject = {
  PARTNERSHIP: "partnership",
  FEEDBACK: "feedback",
  BUG: "bug",
  FEATURE: "feature",
  PRESS: "press",
  OTHER: "other",
} as const;

export type ContactSubjectType =
  (typeof ContactSubject)[keyof typeof ContactSubject];
