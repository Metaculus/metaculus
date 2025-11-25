"use client";
import { useTranslations } from "next-intl";
import React, { useCallback, useMemo, useState } from "react";

import { KeyFactor } from "@/types/comment";
import { PostWithForecasts } from "@/types/post";
import cn from "@/utils/core/cn";

import {
  KeyFactorTileDriverView,
  KeyFactorTileNewsView,
  KeyFactorTileBaseRateTrendView,
  KeyFactorTileBaseRateFreqView,
  KeyFactorTileQuestionLinkView,
  type Props as KfDisplayProps,
} from "./key_factor_tile_view";

type Props = {
  post: Pick<PostWithForecasts, "id" | "key_factors">;
  maxItems?: number;
  className?: string;
};

const KF_COMPONENTS = {
  driver: KeyFactorTileDriverView,
  news: KeyFactorTileNewsView,
  baseRateTrend: KeyFactorTileBaseRateTrendView,
  baseRateFreq: KeyFactorTileBaseRateFreqView,
  questionLink: KeyFactorTileQuestionLinkView,
} satisfies Record<string, React.FC<KfDisplayProps>>;

function pickKfComponent(kf: KeyFactor): React.FC<KfDisplayProps> {
  const brType = kf.base_rate?.type;
  if (brType === "trend") return KF_COMPONENTS.baseRateTrend;
  if (brType === "frequency") return KF_COMPONENTS.baseRateFreq;
  if (kf.news) return KF_COMPONENTS.news;

  return KF_COMPONENTS.driver;
}

const MAX_DEFAULT = 3;

const KeyFactorsTileView: React.FC<Props> = ({
  post,
  maxItems = MAX_DEFAULT,
  className,
}) => {
  const t = useTranslations();
  const [expandedIds, setExpandedIds] = useState<Array<KeyFactor["id"]>>([]);

  const items = useMemo(
    () =>
      [...(post.key_factors ?? [])]
        .sort((a, b) => score(b) - score(a))
        .slice(0, maxItems),
    [post.key_factors, maxItems]
  );

  const onToggle = useCallback((id: KeyFactor["id"]) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  if (items.length === 0) return null;

  return (
    <div className={cn("mt-4", className)}>
      <p className="my-0 mb-3 text-[10px] font-medium uppercase text-gray-500 dark:text-gray-500-dark">
        {t("keyFactors")}
      </p>

      <ul className="flex flex-col gap-1">
        {items.map((kf) => {
          const expanded = expandedIds.includes(kf.id);
          const Display = pickKfComponent(kf);

          return (
            <li key={kf.id}>
              <Display
                kf={kf}
                expanded={expanded}
                onToggle={() => onToggle(kf.id)}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
};

const score = (kf: KeyFactor) => (kf.freshness ?? 0) * 10;

export default KeyFactorsTileView;
