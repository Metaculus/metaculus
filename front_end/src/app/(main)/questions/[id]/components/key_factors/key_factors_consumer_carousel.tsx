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
import { openKeyFactorsSectionAndScrollTo } from "./utils";
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
  const { requestKeyFactorsExpand } = useQuestionLayout();

  const openKeyFactorsElement = (selector: string) => {
    requestKeyFactorsExpand?.();
    openKeyFactorsSectionAndScrollTo({
      selector,
      mobileOnly: false,
    });
    sendAnalyticsEvent("KeyFactorClick", {
      event_label: "fromTopList",
    });
  };

  return (
    <KeyFactorsCarousel
      listClassName="pb-0 [&>:first-child]:pl-4 [&>:last-child]:pr-4 sm:[&>:first-child]:pl-0 sm:[&>:last-child]:pr-0"
      items={items}
      renderItem={(item) =>
        item.kind === "keyFactor" ? (
          <button
            className="text-left no-underline"
            type="button"
            onClick={(e) => {
              e.preventDefault();
              if (onKeyFactorClick) {
                onKeyFactorClick(item.keyFactor);
                sendAnalyticsEvent("KeyFactorClick", {
                  event_label: "fromTopList",
                });
              } else {
                openKeyFactorsElement(`[id="key-factor-${item.keyFactor.id}"]`);
              }
            }}
          >
            <KeyFactorItem
              keyFactor={item.keyFactor}
              mode="consumer"
              isCompact={!isDesktop}
              className={cn(
                "sm:max-w-[200px]",
                lightVariant && "bg-gray-0 dark:bg-gray-0-dark"
              )}
            />
          </button>
        ) : (
          <button
            className="text-left no-underline"
            onClick={(e) => {
              e.preventDefault();
              openKeyFactorsElement(`[id="question-link-kf-${item.link.id}"]`);
            }}
          >
            <QuestionLinkKeyFactorItem
              link={item.link}
              post={post}
              mode="consumer"
              compact={!isDesktop}
              linkToComment={false}
              className={cn(lightVariant && "bg-gray-0 dark:bg-gray-0-dark")}
            />
          </button>
        )
      }
    />
  );
};

export default KeyFactorsConsumerCarousel;
