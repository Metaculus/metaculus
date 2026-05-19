"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import ReusableGradientCarousel from "@/components/gradient-carousel";
import cn from "@/utils/core/cn";

type JobNavItem = { slug: string; name: string; value2035: number | null };

type Props = {
  current: string;
  items: JobNavItem[];
};

function tone(value: number | null): string {
  if (value == null)
    return "bg-blue-200 text-blue-700 dark:bg-blue-200-dark dark:text-blue-700-dark";
  if (value > 0)
    return "bg-mc-option-light-3 text-olive-900 dark:bg-olive-300-dark dark:text-olive-900-dark";
  if (value < 0)
    return "bg-mc-option-light-2 text-salmon-800 dark:bg-salmon-100-dark dark:text-salmon-200-dark";
  return "bg-blue-200 text-blue-700 dark:bg-blue-200-dark dark:text-blue-700-dark";
}

function formatPercent(value: number | null): string {
  if (value == null) return "";
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${Math.abs(value).toFixed(0)}%`;
}

export function JobNavStrip({ current, items }: Props) {
  const t = useTranslations();

  return (
    <div className="flex items-center gap-3">
      <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-700-dark">
        {t("laborHubJobsJumpToLabel")}
      </span>
      <div className="min-w-0 flex-1">
        <ReusableGradientCarousel
          items={items}
          itemClassName="w-auto"
          gapClassName="gap-2"
          slideBy={{ mode: "items", count: 3 }}
          gradientFromClass="from-gray-0 dark:from-gray-0-dark"
          arrowClassName="w-8 h-8 text-blue-700 dark:text-blue-700-dark bg-gray-0 dark:bg-gray-0-dark rounded-full shadow-sm"
          arrowLeftPosition="left-0"
          arrowRightPosition="right-0"
          renderItem={(item) => {
            const isActive = item.slug === current;
            return (
              <Link
                href={`/labor-hub/jobs/${item.slug}/`}
                scroll={false}
                replace={isActive}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium",
                  isActive
                    ? "bg-blue-900 text-gray-0 dark:bg-blue-900-dark dark:text-gray-0-dark"
                    : tone(item.value2035),
                  "transition-colors hover:opacity-80"
                )}
              >
                <span>{item.name}</span>
                {item.value2035 != null && (
                  <span className="font-geist-mono text-xs font-semibold opacity-80">
                    {formatPercent(item.value2035)}
                  </span>
                )}
              </Link>
            );
          }}
        />
      </div>
    </div>
  );
}
