"use client";

import { faArrowUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useLocale } from "next-intl";
import { FC } from "react";

import { ImpactDirection, ImpactDirectionCategory } from "@/types/comment";
import { QuestionType } from "@/types/question";
import cn from "@/utils/core/cn";
import { formatRelativeDate } from "@/utils/formatters/date";

import { NewsAnnotation } from "./types";
import { KeyFactorImpactDirectionLabel } from "../../../../app/(main)/questions/[id]/components/key_factors/item_creation/driver/impact_direction_label";
import VerticalImpactBar from "../../../../app/(main)/questions/[id]/components/key_factors/item_view/vertical_impact_bar";
import { convertNumericImpactToDirectionCategory } from "../../../../app/(main)/questions/[id]/components/key_factors/utils";

type Props = {
  annotation: NewsAnnotation;
  questionType?: QuestionType;
};

function directionToCategory(
  direction: ImpactDirection | null,
  questionType: QuestionType
): ImpactDirectionCategory | null {
  if (!direction) return null;
  const impactDirection =
    direction === "increase" ? 1 : direction === "decrease" ? -1 : null;
  const certainty = direction === "uncertainty" ? -1 : null;
  return convertNumericImpactToDirectionCategory(
    impactDirection as 1 | -1 | null,
    certainty as -1 | null,
    questionType
  );
}

const NewsAnnotationPopupCard: FC<Props> = ({
  annotation,
  questionType = QuestionType.Binary,
}) => {
  const locale = useLocale();
  const { title, source, imgUrl, url, direction, strength } = annotation;

  const impactCategory = directionToCategory(direction, questionType);

  const publishedDate = annotation.keyFactor.news?.published_at
    ? new Date(annotation.keyFactor.news.published_at)
    : new Date(annotation.keyFactor.created_at);

  const handleClick = () => {
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div
      className={cn(
        "dark flex gap-3 rounded-xl bg-blue-800 p-4 dark:bg-blue-300-dark",
        url && "cursor-pointer"
      )}
      onClick={handleClick}
    >
      <VerticalImpactBar
        direction={direction}
        strength={strength}
        size="narrow"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex gap-2.5">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p className="m-0 line-clamp-3 text-xs font-medium leading-4 text-gray-800-dark">
              {title}
            </p>
            <div className="flex items-center gap-1.5 text-[10px]">
              <span className="truncate text-blue-600-dark">{source}</span>
              {publishedDate && !isNaN(publishedDate.getTime()) && (
                <>
                  <span className="text-blue-400-dark">•</span>
                  <span
                    className="whitespace-nowrap text-blue-600-dark"
                    suppressHydrationWarning
                  >
                    {formatRelativeDate(locale, publishedDate)}
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="flex flex-shrink-0 flex-col items-center gap-1">
            {imgUrl && (
              <img
                className="size-10 rounded object-cover"
                src={imgUrl}
                alt={title}
              />
            )}
            {url && (
              <FontAwesomeIcon
                icon={faArrowUpRightFromSquare}
                className="text-[14px] leading-none text-blue-700-dark"
              />
            )}
          </div>
        </div>
        {impactCategory !== null && (
          <KeyFactorImpactDirectionLabel
            impact={impactCategory}
            className="text-[10px] !text-olive-900-dark"
            hideIcon
          />
        )}
      </div>
    </div>
  );
};

export default NewsAnnotationPopupCard;
