import { ImpactMetadata } from "./comment";

type WithQuestionRef = {
  question_id?: number;
  question_option?: string;
};

export type DriverDraft = WithQuestionRef & {
  driver: ImpactMetadata & { text: string };
  base_rate?: never;
  news?: never;
};

export type BaseRateType = "frequency" | "trend";

export type BaseRateDraft = WithQuestionRef & {
  driver?: never;
  news?: never;
  base_rate: {
    type: BaseRateType;
    reference_class: string;

    rate_numerator?: number | null;
    rate_denominator?: number | null;

    projected_value?: number | null;
    projected_by_year?: number | null;

    unit: string;
    extrapolation?: "" | "linear" | "exponential" | "other";
    based_on?: string;
    source: string;
  };
};

export type NewsDraft = WithQuestionRef & {
  driver?: never;
  base_rate?: never;
  news: ImpactMetadata & {
    itn_article_id?: number | null;
    url?: string | null;
    title?: string | null;
    source?: string | null;
    img_url?: string | null;
    published_at?: string | null;
  };
};

export type KeyFactorDraft = DriverDraft | BaseRateDraft | NewsDraft;
