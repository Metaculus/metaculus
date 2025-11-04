"use client";
import { useTranslations } from "next-intl";
import React, { useCallback, useMemo, useState } from "react";

import { KeyFactor } from "@/types/comment";
import { PostWithForecasts } from "@/types/post";
import cn from "@/utils/core/cn";

import {
  KeyFactorTileDriverDisplay,
  KeyFactorTileNewsDisplay,
  KeyFactorTileBaseRateTrendDisplay,
  KeyFactorTileBaseRateFreqDisplay,
  KeyFactorTileQuestionLinkDisplay,
  type Props as KfDisplayProps,
} from "./key_factor_tile_display";

type Props = {
  post: Pick<PostWithForecasts, "id" | "key_factors">;
  maxItems?: number;
  className?: string;
};

const KF_COMPONENTS = {
  driver: KeyFactorTileDriverDisplay,
  news: KeyFactorTileNewsDisplay,
  baseRateTrend: KeyFactorTileBaseRateTrendDisplay,
  baseRateFreq: KeyFactorTileBaseRateFreqDisplay,
  questionLink: KeyFactorTileQuestionLinkDisplay,
} satisfies Record<string, React.FC<KfDisplayProps>>;

function pickKfComponent(_kf: KeyFactor): React.FC<KfDisplayProps> {
  return KF_COMPONENTS.driver;
}

const MAX_DEFAULT = 3;

const KeyFactorsTileDisplay: React.FC<Props> = ({
  post,
  maxItems = MAX_DEFAULT,
  className,
}) => {
  const t = useTranslations();
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const items = useMemo(
    () =>
      [...(post.key_factors ?? [])]
        .sort((a, b) => score(b) - score(a))
        .slice(0, maxItems),
    [post.key_factors, maxItems]
  );

  const onToggle = useCallback(
    (idx: number) => setExpandedIdx(expandedIdx === idx ? null : idx),
    [expandedIdx]
  );

  if (items.length === 0) return null;

  return (
    <div className={cn("mt-4", className)}>
      <p className="my-0 mb-3 text-[10px] font-medium uppercase text-gray-500 dark:text-gray-500-dark">
        {t("keyFactors")}
      </p>

      <ul className="flex flex-col gap-1">
        {items.map((kf, idx) => {
          const expanded = expandedIdx === idx;
          const Display = pickKfComponent(kf);
          return (
            <li key={kf.id}>
              <button
                type="button"
                onClick={() => onToggle(idx)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") onToggle(idx);
                }}
                aria-expanded={expanded}
                className="w-full text-left"
              >
                <Display kf={kf} expanded={expanded} />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

const score = (kf: KeyFactor) => (kf.freshness ?? 0) * 10;

export default KeyFactorsTileDisplay;
