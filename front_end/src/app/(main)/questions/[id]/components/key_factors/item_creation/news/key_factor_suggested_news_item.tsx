"use client";

import { useTranslations } from "next-intl";
import React, { Dispatch, SetStateAction } from "react";

import ImpactDirectionControls from "@/app/(main)/questions/[id]/components/key_factors/item_creation/driver/impact_direction_controls";
import { ImpactMetadata } from "@/types/comment";
import { NewsArticle } from "@/types/news";
import { PostWithForecasts } from "@/types/post";
import { QuestionType } from "@/types/question";
import cn from "@/utils/core/cn";

import KeyFactorNewsItem from "../../item_view/news/key_factor_news_item";
import OptionTargetPicker, { Target } from "../driver/option_target_picker";

type Props = {
  post: PostWithForecasts;
  article: NewsArticle;
  selected: boolean;
  impact: ImpactMetadata | null;
  target: Target;
  onTargetChange: Dispatch<SetStateAction<Target>>;
  onToggleSelect: (id: number) => void;
  onSelectImpact: (id: number, impact: ImpactMetadata) => void;
  questionType?: QuestionType;
  unit?: string;
  className?: string;
};

const KeyFactorSuggestedNewsItem: React.FC<Props> = ({
  post,
  article,
  selected,
  impact,
  target,
  onTargetChange,
  onToggleSelect,
  onSelectImpact,
  questionType = QuestionType.Binary,
  unit,
  className,
}) => {
  const t = useTranslations();

  const stopAll = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    e.nativeEvent?.stopImmediatePropagation?.();
  };

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
        "flex cursor-pointer flex-col gap-3 rounded border p-3 antialiased transition-colors duration-150 focus:outline-none",
        selected
          ? "border-blue-700 bg-blue-200 dark:border-blue-700-dark dark:bg-blue-200-dark"
          : "border-blue-400 bg-blue-100 hover:bg-blue-200 dark:border-blue-400-dark dark:bg-blue-100-dark dark:hover:bg-blue-200-dark",
        className
      )}
    >
      <KeyFactorNewsItem
        faviconUrl={article.favicon_url ?? ""}
        source={article.media_label}
        title={article.title}
        createdAt={article.created_at ?? ""}
        url={article.url}
      />

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

          <div onClick={stopAll} onMouseDown={stopAll} onKeyDown={stopAll}>
            <OptionTargetPicker
              post={post}
              value={target}
              onChange={onTargetChange}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default KeyFactorSuggestedNewsItem;
