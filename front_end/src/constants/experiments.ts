export const AUTOTRANSLATION_FLAG_KEY = "autotranslation_experiment";
export const AUTOTRANSLATION_COOKIE_NAME = "metaculus_autotranslation_ab";
// Carries the variant on the enrollment request itself, before the
// assignment cookie exists (same mechanism as x-nonce/x-url in proxy.ts)
export const AUTOTRANSLATION_HEADER = "x-autotranslation-variant";
export const AUTOTRANSLATION_COOKIE_MAX_AGE = 60 * 60 * 24 * 182; // 26 weeks

export const AUTOTRANSLATION_VARIANTS = ["control", "test"] as const;
export type AutotranslationVariant = (typeof AUTOTRANSLATION_VARIANTS)[number];

export type AutotranslationAssignment = {
  distinctId: string;
  variant: AutotranslationVariant;
};

export const AUTOTRANSLATION_TARGET_LOCALES = ["cs", "es", "pt", "zh", "zh-TW"];
