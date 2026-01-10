"use client";
import {
  faArrowUp,
  faEllipsis,
  faHome,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useFeatureFlagEnabled } from "posthog-js/react";
import { FC, Fragment, useMemo, useState } from "react";

import TopicItem from "@/app/(main)/questions/components/topic_item";
import useFeed from "@/app/(main)/questions/hooks/use_feed";
import Button from "@/components/ui/button";
import { FeedType } from "@/constants/posts_feed";
import { useAuth } from "@/contexts/auth_context";
import { usePublicSettings } from "@/contexts/public_settings_context";
import { useContentTranslatedBannerContext } from "@/contexts/translations_banner_context";
import useSearchParams from "@/hooks/use_search_params";
import {
  SidebarItem,
  SidebarMenuItem,
  SidebarSectionType,
} from "@/types/sidebar";
import { sendAnalyticsEvent } from "@/utils/analytics";
import cn from "@/utils/core/cn";
import { convertSidebarItem } from "@/utils/sidebar";

type Props = {
  items: SidebarItem[];
};

type SidebarSection = {
  type: SidebarSectionType;
  title?: string;
  items: SidebarMenuItem[];
};

const FeedSidebar: FC<Props> = ({ items }) => {
  const t = useTranslations();
  const { user } = useAuth();
  const { PUBLIC_MINIMAL_UI } = usePublicSettings();
  const { getFeedUrl, currentFeed } = useFeed();
  const pathname = usePathname();
  const { params } = useSearchParams();
  const fullPathname = `${pathname}${params.toString() ? `?${params.toString()}` : ""}`;

  const isWeeklyTopCommentsFeatureEnabled = useFeatureFlagEnabled(
    "weekly_top_comments"
  );

  const sidebarSections: SidebarSection[] = useMemo(() => {
    const menuItems: SidebarMenuItem[] = [
      {
        name: t("feedHome"),
        emoji: <FontAwesomeIcon icon={faHome} />,
        url: getFeedUrl(FeedType.HOME),
        isActive: currentFeed == FeedType.HOME,
      },
      ...(user
        ? [
            {
              name: t("myPredictions"),
              emoji: "👤",
              onClick: () => {
                sendAnalyticsEvent("sidebarClick", {
                  event_category: t("myPredictions"),
                });
              },
              url: getFeedUrl(FeedType.MY_PREDICTIONS),
              isActive: currentFeed == FeedType.MY_PREDICTIONS,
            },
            {
              name: t("myQuestionsAndPosts"),
              emoji: "✍️",
              onClick: () => {
                sendAnalyticsEvent("sidebarClick", {
                  event_category: t("myQuestionsAndPosts"),
                });
              },
              url: getFeedUrl(FeedType.MY_QUESTIONS_AND_POSTS),
              isActive: currentFeed == FeedType.MY_QUESTIONS_AND_POSTS,
            },
            {
              name: t("followingButton"),
              emoji: "🔎 ",
              onClick: () => {
                sendAnalyticsEvent("sidebarClick", {
                  event_category: t("followingButton"),
                });
              },
              url: getFeedUrl(FeedType.FOLLOWING),
              isActive: currentFeed == FeedType.FOLLOWING,
            },
          ]
        : []),
      ...(!PUBLIC_MINIMAL_UI
        ? [
            ...(isWeeklyTopCommentsFeatureEnabled
              ? [
                  {
                    name: t("weeklyTopCommentsShort"),
                    emoji: "💬",
                    onClick: () => {
                      sendAnalyticsEvent("sidebarClick", {
                        event_category: t("weeklyTopComments"),
                      });
                    },
                    url: getFeedUrl(FeedType.WEEKLY_TOP_COMMENTS),
                    isActive: currentFeed == FeedType.WEEKLY_TOP_COMMENTS,
                  },
                ]
              : []),
          ]
        : []),
      ...items.map((obj) => convertSidebarItem(obj, fullPathname)),
    ];

    return [
      {
        type: null,
        items: menuItems.filter(({ section }) => !section),
      },
      {
        type: "hot_topics",
        title: t("topics"),
        items: menuItems.filter(({ section }) => section == "hot_topics"),
      },
      {
        type: "hot_categories",
        title: t("categories"),
        items: menuItems.filter(({ section }) => section == "hot_categories"),
      },
    ];
  }, [
    PUBLIC_MINIMAL_UI,
    currentFeed,
    fullPathname,
    items,
    t,
    user,
    isWeeklyTopCommentsFeatureEnabled,
    getFeedUrl,
  ]);

  const [isMobileExpanded, setIsMobileExpanded] = useState(false);

  const { bannerIsVisible: isTranslationBannerVisible } =
    useContentTranslatedBannerContext();

  const topPositionClasses = isTranslationBannerVisible
    ? "top-24 lg:top-20"
    : "top-12 lg:top-20";

  return (
    <div
      className={cn(
        "sticky z-100 mt-0 self-start sm:top-16 sm:mt-4",
        topPositionClasses
      )}
    >
      <div className="relative w-full border-y border-blue-400 bg-gray-0/75 p-3 backdrop-blur-md no-scrollbar dark:border-blue-700 dark:bg-blue-50-dark/75 sm:max-h-[calc(100vh-76px)] sm:overflow-y-auto sm:border-none sm:bg-blue-200/0 sm:p-2 sm:pt-0 sm:dark:bg-blue-50-dark/0">
        <div
          className={cn(
            "pointer-events-none absolute right-0 top-0 z-20 h-full w-32 bg-gradient-to-r from-transparent to-blue-100 dark:to-blue-50-dark sm:hidden",
            isMobileExpanded && "hidden"
          )}
        />
        <div
          className={cn(
            "absolute right-2 z-20 sm:hidden",
            isMobileExpanded ? "bottom-3.5" : "top-3.5"
          )}
        >
          <Button
            aria-label={t("toggleAllTopics")}
            onClick={() => setIsMobileExpanded((prev) => !prev)}
            variant="tertiary"
            presentationType="icon"
          >
            <FontAwesomeIcon
              className={cn({ "-rotate-180": !isMobileExpanded })}
              icon={faArrowUp}
            />
          </Button>
        </div>

        <div
          className={cn(
            "relative z-10 flex snap-x gap-1.5 gap-y-2 overflow-x-auto pr-8 no-scrollbar sm:static sm:w-56 sm:flex-col sm:gap-y-1.5 sm:overflow-hidden sm:p-1 md:w-[210px] md:px-0 min-[812px]:w-64 min-[812px]:px-1",
            isMobileExpanded ? "flex-wrap" : "pr-10"
          )}
        >
          {sidebarSections
            .filter(({ items }) => items.length > 0)
            .map(({ type: sectionType, title, items }) => (
              <Fragment key={`menu-${sectionType}`}>
                {title && (
                  <div className="mt-1 hidden pl-2 text-sm font-bold uppercase tracking-wide text-gray-500 dark:text-gray-500-dark sm:block">
                    {title}
                  </div>
                )}
                {items.map(({ name, emoji, onClick, url, isActive }, idx) => (
                  <TopicItem
                    key={`menu-${sectionType}-${idx}`}
                    text={name}
                    emoji={emoji}
                    href={url}
                    onClick={() => {
                      setIsMobileExpanded(false);
                      onClick && onClick();
                    }}
                    isActive={isActive ?? false}
                  />
                ))}
              </Fragment>
            ))}

          <TopicItem
            href="/questions/discovery"
            text={t("seeAllCategories")}
            emoji={<FontAwesomeIcon icon={faEllipsis} />}
            isActive={false}
            onClick={() => {
              sendAnalyticsEvent("sidebarClick", {
                event_category: t("seeAllCategories"),
              });
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default FeedSidebar;
