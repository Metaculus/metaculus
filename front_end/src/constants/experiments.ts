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

// Subscribe-capture flow experiment: control shows the options step with
// "Notify me of updates" copy, test goes straight to the email input with
// "Notify me when this resolves" and subscribes to resolution only.
// Shares the "distinctId:variant" cookie format (parse/serializeAssignment)
// and the control/test variant set with the auto-translation experiment.
export const SUBSCRIBE_CAPTURE_FLAG_KEY = "subscribe_capture_experiment";
export const SUBSCRIBE_CAPTURE_COOKIE_NAME = "metaculus_subscribe_capture_ab";
export const SUBSCRIBE_CAPTURE_HEADER = "x-subscribe-capture-variant";
export const SUBSCRIBE_CAPTURE_COOKIE_MAX_AGE = 60 * 60 * 24 * 182; // 26 weeks

export const EXPERIMENT_VARIANTS = AUTOTRANSLATION_VARIANTS;
export type ExperimentVariant = AutotranslationVariant;
export type ExperimentAssignment = AutotranslationAssignment;

export function parseAssignment(
  raw: string | undefined
): AutotranslationAssignment | null {
  if (!raw) return null;

  const separatorIndex = raw.lastIndexOf(":");
  if (separatorIndex <= 0) return null;

  try {
    const distinctId = decodeURIComponent(raw.slice(0, separatorIndex));
    const variant = raw.slice(separatorIndex + 1) as AutotranslationVariant;
    if (!distinctId || !AUTOTRANSLATION_VARIANTS.includes(variant)) {
      return null;
    }
    return { distinctId, variant };
  } catch {
    return null;
  }
}

export function serializeAssignment(
  assignment: AutotranslationAssignment
): string {
  return `${encodeURIComponent(assignment.distinctId)}:${assignment.variant}`;
}
