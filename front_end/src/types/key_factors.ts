export type KeyFactorDraft = {
  question_id?: number;
  question_option?: string;
  driver: {
    text: string;
    impact_direction: 1 | -1 | null;
    certainty: -1 | null;
  };
};
