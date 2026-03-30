"use client";

import { useBreakpoint } from "@/hooks/tailwind";
import { KeyFactor } from "@/types/comment";
import { PostWithForecasts } from "@/types/post";
import { sendAnalyticsEvent } from "@/utils/analytics";
import cn from "@/utils/core/cn";

import { KeyFactorItem } from "./item_view";
import QuestionLinkKeyFactorItem from "./item_view/question_link/question_link_key_factor_item";
import KeyFactorsCarousel from "./key_factors_carousel";
import { TopItem } from "./types";
import { useQuestionLayout } from "../question_layout/question_layout_context";

type Props = {
  post: PostWithForecasts;
  items: TopItem[];
  lightVariant?: boolean;
  onKeyFactorClick?: (keyFactor: KeyFactor) => void;
};

const KeyFactorsConsumerCarousel: React.FC<Props> = ({
  post,
  items,
  lightVariant,
  onKeyFactorClick,
}) => {
  const isDesktop = useBreakpoint("sm");
  const { openKeyFactorOverlay, openQuestionLinkOverlay } = useQuestionLayout();

  return (
    <KeyFactorsCarousel
      listClassName="pb-0 [&>:first-child]:pl-4 [&>:last-child]:pr-4 sm:[&>:first-child]:pl-0 sm:[&>:last-child]:pr-0"
      items={items}
      renderItem={(item) =>
        item.kind === "keyFactor" ? (
          <div
            className="cursor-pointer text-left no-underline"
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.preventDefault();
              if (onKeyFactorClick) {
                onKeyFactorClick(item.keyFactor);
              } else {
                openKeyFactorOverlay(item.keyFactor);
              }
              sendAnalyticsEvent("KeyFactorClick", {
                event_label: "fromTopList",
              });
            }}
          >
            <KeyFactorItem
              keyFactor={item.keyFactor}
              linkToComment={false}
              mode="consumer"
              isCompact={!isDesktop}
              truncateText
              titleLinksToArticle={false}
              className={cn(
                "max-w-[160px] sm:max-w-[200px]",
                lightVariant && "bg-gray-0 dark:bg-gray-0-dark"
              )}
            />
          </div>
        ) : (
          <div
            className="cursor-pointer text-left no-underline"
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.preventDefault();
              openQuestionLinkOverlay(item.link);
              sendAnalyticsEvent("KeyFactorClick", {
                event_label: "fromTopList",
              });
            }}
          >
            <QuestionLinkKeyFactorItem
              link={item.link}
              post={post}
              mode="consumer"
              compact={!isDesktop}
              linkToComment={false}
              titleLinksToQuestion={false}
              className={cn(
                "max-w-[160px] sm:max-w-[200px]",
                lightVariant && "bg-gray-0 dark:bg-gray-0-dark"
              )}
            />
          </div>
        )
      }
    />
  );
};

export default KeyFactorsConsumerCarousel;
