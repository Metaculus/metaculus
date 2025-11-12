"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";

import { BaseRateDraft } from "@/types/key_factors";

export type KFErrors = Record<string, string | undefined>;

export default function useBaseRateValidation(
  draft: BaseRateDraft | undefined
) {
  const t = useTranslations();

  return useMemo(() => {
    const errs: KFErrors = {};
    if (!draft) return { errors: errs, isValid: false };

    const br = draft.base_rate;
    const ref = (br.reference_class ?? "").trim();
    const unit = (br.unit ?? "").trim();
    const source = (br.source ?? "").trim();

    if (!ref) errs.reference_class = t("referenceClassRequired");
    if (!unit) errs.unit = t("unitRequired");
    if (!source) errs.source = t("sourceRequired");

    if (br.type === "frequency") {
      const num = br.rate_numerator;
      const den = br.rate_denominator;

      if (num == null || Number.isNaN(num) || num < 0) {
        errs.rate = t("rateNumeratorGte0");
      } else if (den == null || Number.isNaN(den) || den < 1) {
        errs.rate = t("rateDenominatorGte1");
      } else if (!(den > num)) {
        errs.rate = t("rateDenominatorGtNumerator");
      } else {
        errs.rate = undefined;
      }
    } else if (br.type === "trend") {
      const pv = br.projected_value;
      const year = br.projected_by_year;

      if (pv === null || pv === undefined || Number.isNaN(pv)) {
        errs.projected_value = t("projectedValueRequired");
      }
      if (year === null || year === undefined || Number.isNaN(year)) {
        errs.projected_by_year = t("yearRequired");
      } else if (year < 1900 || year > 2100) {
        errs.projected_by_year = t("yearOutOfRange", { min: 1900, max: 2100 });
      }

      if (!br.extrapolation) errs.extrapolation = t("extrapolationRequired");
    }

    const isValid = Object.values(errs).every((m) => !m);
    return { errors: errs, isValid };
  }, [draft, t]);
}
