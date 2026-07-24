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
