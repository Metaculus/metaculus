export type DriverDraft = {
  question_id?: number;
  question_option?: string;
  driver: {
    text: string;
    impact_direction: 1 | -1 | null;
    certainty: -1 | null;
  };
  base_rate?: never;
};

export type BaseRateType = "frequency" | "trend";

export type BaseRateDraft = {
  question_id?: number;
  question_option?: string;
  driver?: never;
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

export type KeyFactorDraft = DriverDraft | BaseRateDraft;
