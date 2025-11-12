"use client";

import { faNewspaper } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useLocale } from "next-intl";
import React from "react";

import ImpactDirectionControls from "@/app/(main)/questions/[id]/components/key_factors/item_creation/driver/impact_direction_controls";
import ImageWithFallback from "@/components/ui/image_with_fallback";
import { ImpactMetadata } from "@/types/comment";
import { NewsArticle } from "@/types/news";
import { QuestionType } from "@/types/question";
import { formatDate } from "@/utils/formatters/date";

import { getProxiedFaviconUrl } from "../../../../utils";

type Props = {
  article: NewsArticle;
  selected: boolean;
  impact: { impact_direction: 1 | -1 | null; certainty: -1 | null } | null;
  onToggleSelect: (id: number) => void;
  onSelectImpact: (id: number, impact: ImpactMetadata) => void;
  chooseDirectionLabel: string;
  questionType?: QuestionType;
  unit?: string;
};

const KeyFactorSuggestedNewsItem: React.FC<Props> = ({
  article,
  selected,
  impact,
  onToggleSelect,
  onSelectImpact,
  chooseDirectionLabel,
  questionType = QuestionType.Binary,
  unit,
}) => {
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
      className={`rounded border p-3 ${selected ? "border-blue-500" : "border-gray-300"} cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400`}
    >
      <div className="flex items-start gap-3">
        {article.favicon_url ? (
          <ImageWithFallback
            className="mr-3 size-8 rounded-full"
            src={getProxiedFaviconUrl(article.favicon_url)}
            alt={`${article.media_label} logo`}
            aria-label={`${article.media_label} logo`}
          >
            <span className="mr-3 flex size-8 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-200-dark">
              <FontAwesomeIcon icon={faNewspaper} size="xl" />
            </span>
          </ImageWithFallback>
        ) : (
          <span className="mr-3 flex size-8 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-200-dark" />
        )}

        <div className="flex-1">
          <div className="font-medium">{article.title}</div>
          <div className="text-muted-foreground text-sm">
            <span>{article.media_label}</span>
            <span className="mx-2">•</span>
            <span suppressHydrationWarning>
              {formatDate(locale, new Date(article.created_at))}
            </span>
          </div>

          {selected && (
            <div
              className="mt-3"
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
              <div className="mb-2 text-sm">{chooseDirectionLabel}</div>
              <ImpactDirectionControls
                questionType={questionType}
                unit={unit}
                impact={impact}
                onSelect={(m) => onSelectImpact(article.id, m)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KeyFactorSuggestedNewsItem;
