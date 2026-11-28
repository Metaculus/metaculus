"use client";

import { useLocale } from "next-intl";
import { useMemo } from "react";

import { medianDate } from "../helpers/forecast";

export const useWorldFormatters = () => {
  const locale = useLocale();
  return useMemo(() => {
    const date = new Intl.DateTimeFormat(locale, {
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
    const percent = new Intl.NumberFormat(locale, {
      style: "percent",
      maximumFractionDigits: 0,
    });
    const count = new Intl.NumberFormat(locale);
    return {
      // Chinese sentences run on without a space.
      sentenceGap: locale.startsWith("zh") ? "" : " ",
      formatDate: (median: number) => date.format(medianDate(median)),
      formatCount: (value: number) => count.format(value),
      formatProbability: (p: number) =>
        p < 0.01
          ? `<${percent.format(0.01)}`
          : p > 0.99
            ? `>${percent.format(0.99)}`
            : percent.format(p),
    };
  }, [locale]);
};
