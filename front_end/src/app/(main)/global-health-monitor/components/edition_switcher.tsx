"use client";

import { useTranslations } from "next-intl";
import { parseAsString, useQueryState } from "nuqs";
import { useTransition } from "react";

import cn from "@/utils/core/cn";

import { EditionLabel } from "../helpers/snapshot";

export function EditionSwitcher({
  editions,
  currentSlug,
  latestSlug,
}: {
  editions: EditionLabel[];
  currentSlug: string;
  latestSlug: string;
}) {
  const t = useTranslations();
  const [isPending, startTransition] = useTransition();
  const [, setEdition] = useQueryState(
    "edition",
    parseAsString.withOptions({
      shallow: false,
      scroll: false,
      history: "push",
      startTransition,
    })
  );

  return (
    <label className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-700-dark print:hidden">
      <span>{t("globalHealthMonitorEditionLabel")}</span>
      <select
        value={currentSlug}
        disabled={isPending}
        onChange={(event) => {
          const slug = event.target.value;
          void setEdition(slug === latestSlug ? null : slug);
        }}
        className={cn(
          "rounded border border-blue-400 bg-gray-0 px-2 py-1 text-sm text-blue-900 dark:border-blue-400-dark dark:bg-gray-0-dark dark:text-blue-900-dark",
          isPending && "opacity-60"
        )}
      >
        {editions.map((edition) => (
          <option key={edition.slug} value={edition.slug}>
            {edition.slug === latestSlug
              ? t("globalHealthMonitorLatestEditionOption", {
                  date: edition.label,
                })
              : edition.label}
          </option>
        ))}
      </select>
    </label>
  );
}
