"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";

import { BaseRateDraft } from "@/types/key_factors";

export type KFErrors = Record<string, string | undefined>;

const MIN_REF_LEN = 20;
const MAX_REF_LEN = 120;

const ALLOWED_EXTRAPOLATIONS = new Set(["linear", "exponential", "other"]);

function looksLikeUrl(raw: string): boolean {
  const value = raw.trim();
  if (!value) return false;
  if (/\s/.test(value)) return false;
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;

  try {
    const url = new URL(withProtocol);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return false;
    }
    const host = url.hostname;
    if (!host || !host.includes(".")) return false;

    const parts = host.split(".");
    const tld = parts[parts.length - 1] ?? "";
    if (tld.length < 2 || !/^[a-zA-Z]+$/.test(tld)) return false;

    return true;
  } catch {
    return false;
  }
}

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

    if (!ref) {
      errs.reference_class = t("referenceClassRequired");
    } else if (ref.length < MIN_REF_LEN || ref.length > MAX_REF_LEN) {
      errs.reference_class = t("referenceClassLengthInvalid", {
        min: MIN_REF_LEN,
        max: MAX_REF_LEN,
      });
    }

    if (!unit) errs.unit = t("unitRequired");

    if (!source) {
      errs.source = t("sourceRequired");
    } else if (!looksLikeUrl(source)) {
      errs.source = t("sourceMustBeLink");
    }

    if (br.type === "frequency") {
      const num = br.rate_numerator;
      const den = br.rate_denominator;

      if (num == null || Number.isNaN(num) || num < 0) {
        errs.rate = t("rateNumeratorGte0");
      } else if (den == null || Number.isNaN(den) || den < 1) {
        errs.rate = t("rateDenominatorGte1");
      } else if (den < num) {
        errs.rate = t("rateDenominatorGteNumerator");
      } else {
        errs.rate = undefined;
      }
    } else if (br.type === "trend") {
      const pv = br.projected_value;
      const year = br.projected_by_year;

      if (pv == null || Number.isNaN(pv)) {
        errs.projected_value = t("projectedValueRequired");
      }

      if (year == null || Number.isNaN(year)) {
        errs.projected_by_year = t("yearRequired");
      } else if (year < 1900 || year > 2100) {
        errs.projected_by_year = t("yearOutOfRange", { min: 1900, max: 2100 });
      }

      const extrap = (br.extrapolation ?? "").trim();
      if (!ALLOWED_EXTRAPOLATIONS.has(extrap)) {
        errs.extrapolation = t("extrapolationRequired");
      }
    }

    const isValid = Object.values(errs).every((m) => !m);
    return { errors: errs, isValid };
  }, [draft, t]);
}
