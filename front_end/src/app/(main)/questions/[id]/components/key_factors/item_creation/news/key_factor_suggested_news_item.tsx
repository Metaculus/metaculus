"use client";

import { faNewspaper } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useLocale, useTranslations } from "next-intl";
import React from "react";

import ImpactDirectionControls from "@/app/(main)/questions/[id]/components/key_factors/item_creation/driver/impact_direction_controls";
import ImageWithFallback from "@/components/ui/image_with_fallback";
import { ImpactMetadata } from "@/types/comment";
import { NewsArticle } from "@/types/news";
import { QuestionType } from "@/types/question";
import cn from "@/utils/core/cn";
import { formatDate } from "@/utils/formatters/date";

import { getProxiedFaviconUrl } from "../../../../utils";

type Props = {
  article: NewsArticle;
  selected: boolean;
  impact: { impact_direction: 1 | -1 | null; certainty: -1 | null } | null;
  onToggleSelect: (id: number) => void;
  onSelectImpact: (id: number, impact: ImpactMetadata) => void;
  questionType?: QuestionType;
  unit?: string;
};

const KeyFactorSuggestedNewsItem: React.FC<Props> = ({
  article,
  selected,
  impact,
  onToggleSelect,
  onSelectImpact,
  questionType = QuestionType.Binary,
  unit,
}) => {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <div
      role="radio"
      aria-checked={selected}
      tabIndex={0}
      onClick={() => onToggleSelect(article.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onToggleSelect(article.id);
      }}
      className={cn(
        "flex cursor-pointer flex-col gap-3 rounded border p-3 antialiased focus:outline-none",
        selected
          ? "border-blue-700 bg-blue-200 dark:border-blue-700-dark dark:bg-blue-200-dark"
          : "border-blue-400 bg-blue-100 dark:border-blue-400-dark dark:bg-blue-100-dark"
      )}
    >
      <div className="flex items-start gap-[14px]">
        {article.favicon_url ? (
          <ImageWithFallback
            className="size-[42px] rounded"
            src={getProxiedFaviconUrl(article.favicon_url)}
            alt={`${article.media_label} logo`}
            aria-label={`${article.media_label} logo`}
          >
            <span className="flex size-[42px] items-center justify-center rounded bg-gray-200 dark:bg-gray-200-dark">
              <FontAwesomeIcon icon={faNewspaper} size="xl" />
            </span>
          </ImageWithFallback>
        ) : (
          <span className="flex size-[42px] items-center justify-center rounded bg-gray-200 dark:bg-gray-200-dark" />
        )}

        <div className="flex flex-1 flex-col gap-1.5">
          <h6 className="my-0 text-sm font-medium text-blue-800 dark:text-blue-800-dark">
            {article.title}
          </h6>
          <div className="flex items-center gap-1.5 text-xs font-normal text-gray-600 dark:text-gray-600-dark">
            <span>{article.media_label}</span>
            <span className="text-gray-400 dark:text-gray-400-dark">•</span>
            <span suppressHydrationWarning>
              {formatDate(locale, new Date(article.created_at))}
            </span>
          </div>
        </div>
      </div>

      {selected && (
        <>
          <hr className="my-0 bg-blue-500 opacity-50 dark:bg-blue-500-dark" />
          <div
            className="flex flex-col gap-2.5"
            onClick={(e) => {
              e.stopPropagation();
              e.nativeEvent?.stopImmediatePropagation?.();
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              e.nativeEvent?.stopImmediatePropagation?.();
            }}
            onKeyDown={(e) => {
              e.stopPropagation();
            }}
          >
            <p className="my-0 text-xs font-medium text-blue-700 dark:text-blue-700-dark">
              {t("chooseDirectionOfImpact")}
            </p>
            <ImpactDirectionControls
              questionType={questionType}
              unit={unit}
              impact={impact}
              onSelect={(m) => onSelectImpact(article.id, m)}
              itemClassName="bg-gray-0 dark:bg-gray-0-dark"
            />
          </div>
        </>
      )}
    </div>
  );
};

export default KeyFactorSuggestedNewsItem;
