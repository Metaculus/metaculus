"use client";
import { Drawer } from "@base-ui/react/drawer";
import { ScrollArea } from "@base-ui/react/scroll-area";
import {
  faBars,
  faChevronUp,
  faHome,
  faMagnifyingGlass,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { FC, Fragment, useEffect, useMemo, useRef, useState } from "react";

import TopicItem from "@/app/(main)/questions/components/topic_item";
import useFeed from "@/app/(main)/questions/hooks/use_feed";
import { FeedType, POST_TEXT_SEARCH_FILTER } from "@/constants/posts_feed";
import { useAuth } from "@/contexts/auth_context";
import { usePublicSettings } from "@/contexts/public_settings_context";
import { useContentTranslatedBannerContext } from "@/contexts/translations_banner_context";
import useSearchParams from "@/hooks/use_search_params";
import { Category } from "@/types/projects";
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
  categories: Category[];
};

type SidebarSection = {
  type: SidebarSectionType;
  title?: string;
  items: SidebarMenuItem[];
};

type SidebarMenuProps = {
  sections: SidebarSection[];
  seeAllCategoriesLabel: string;
  onItemSelect?: () => void;
  className?: string;
};

const FeedSidebar: FC<Props> = ({ items, categories }) => {
  const t = useTranslations();
  const { user } = useAuth();
  const { PUBLIC_MINIMAL_UI } = usePublicSettings();
  const { getFeedUrl, currentFeed } = useFeed();
  const pathname = usePathname();
  const { params } = useSearchParams();
  const fullPathname = `${pathname}${params.toString() ? `?${params.toString()}` : ""}`;
  const searchQuery = params.get(POST_TEXT_SEARCH_FILTER)?.trim() ?? "";
  const hasActiveSearch = !!searchQuery;
  const { bannerIsVisible: isTranslationBannerVisible } =
    useContentTranslatedBannerContext();

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
      // Category SidebarItems are legacy; feed categories now come from /projects/categories/.
      ...items
        .filter((obj) => obj.section !== "hot_categories")
        .map((obj) => convertSidebarItem(obj, fullPathname)),
      ...categories
        .filter((category) => category.posts_count > 0)
        .map((category) =>
          convertSidebarItem(
            {
              id: String(category.id),
              name: category.name,
              emoji: category.emoji ?? "",
              section: "hot_categories",
              project: category,
            },
            fullPathname
          )
        ),
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
    categories,
    items,
    t,
    user,
    getFeedUrl,
  ]);

  const outerRef = useRef<HTMLDivElement | null>(null);
  const mobileMenuChipRef = useRef<HTMLDivElement | null>(null);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const mobileMainItems =
    sidebarSections.find(({ type }) => type === null)?.items ?? [];
  const mobileSearchItem: SidebarMenuItem | null = hasActiveSearch
    ? {
        name: searchQuery,
        emoji: <FontAwesomeIcon icon={faMagnifyingGlass} />,
        url: fullPathname,
        isActive: true,
      }
    : null;
  const selectedMobileItem =
    mobileSearchItem ??
    sidebarSections
      .flatMap(({ items }) => items)
      .find(({ isActive }) => isActive) ??
    mobileMainItems[0];
  const mobileRailItems = selectedMobileItem
    ? mobileMainItems.filter(({ url }) => url !== selectedMobileItem.url)
    : mobileMainItems;

  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;

    const obs = new ResizeObserver(([entry]) => {
      const h = entry?.borderBoxSize?.[0]?.blockSize ?? el.offsetHeight;
      document.documentElement.style.setProperty(
        "--feed-sidebar-mobile-height",
        `${h}px`
      );
    });

    obs.observe(el);
    return () => {
      obs.disconnect();
      document.documentElement.style.removeProperty(
        "--feed-sidebar-mobile-height"
      );
    };
  }, []);

  useEffect(() => {
    const chip = mobileMenuChipRef.current;
    const outer = outerRef.current;
    if (!chip || !outer) return;

    const obs = new ResizeObserver(([entry]) => {
      const width = entry?.borderBoxSize?.[0]?.inlineSize ?? chip.offsetWidth;
      outer.style.setProperty("--mobile-menu-chip-width", `${width}px`);
    });

    obs.observe(chip);
    return () => {
      obs.disconnect();
      outer.style.removeProperty("--mobile-menu-chip-width");
    };
  }, [selectedMobileItem?.name]);

  return (
    <>
      <Drawer.Root
        open={isMobileDrawerOpen}
        onOpenChange={setIsMobileDrawerOpen}
        swipeDirection="left"
      >
        <div
          ref={outerRef}
          className={cn(
            "sticky z-100 border-y border-blue-400 bg-gray-0/70 backdrop-blur-md dark:border-blue-700 dark:bg-gray-0-dark/70 sm:hidden",
            isTranslationBannerVisible ? "top-24" : "top-header"
          )}
        >
          <div className="relative w-full p-2 no-scrollbar">
            <div className="relative z-10 -mr-2 flex snap-x gap-1.5 gap-y-2 overflow-x-auto pl-[calc(var(--mobile-menu-chip-width,8rem)+0.375rem)] pr-0 no-scrollbar [mask-image:linear-gradient(to_right,transparent_0,transparent_calc(var(--mobile-menu-chip-width,8rem)-0.25rem),black_calc(var(--mobile-menu-chip-width,8rem)+0.875rem),black_100%)]">
              {mobileRailItems.map(
                ({ name, emoji, onClick, url, isActive }, idx) => (
                  <TopicItem
                    key={`mobile-menu-main-${idx}`}
                    text={name}
                    emoji={emoji}
                    href={url}
                    onClick={() => {
                      onClick?.();
                    }}
                    isActive={isActive ?? false}
                    className="shrink-0"
                  />
                )
              )}
            </div>

            <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-[calc(var(--mobile-menu-chip-width,8rem)+1.25rem)] bg-gradient-to-r from-gray-0 via-gray-0/95 to-gray-0/0 dark:from-gray-0-dark dark:via-gray-0-dark/95 dark:to-gray-0-dark/0" />
            <div ref={mobileMenuChipRef} className="absolute left-2 top-2 z-30">
              <Drawer.Trigger
                aria-label={`${t("menu")}: ${selectedMobileItem?.name ?? t("menu")}`}
                className="inline-flex max-w-[min(16rem,70vw)] cursor-pointer items-center justify-center gap-1 rounded-full bg-blue-800 p-1.5 px-2 text-sm leading-4 text-gray-0 no-underline shadow-sm hover:bg-blue-800 dark:bg-blue-800-dark dark:text-gray-200-dark dark:hover:bg-blue-800-dark"
              >
                <FontAwesomeIcon icon={faBars} className="text-sm" />
                {selectedMobileItem?.emoji && (
                  <span className="inline-flex flex-row items-center justify-center text-sm leading-4 tracking-widest">
                    {selectedMobileItem.emoji}
                  </span>
                )}
                <span className="min-w-0 truncate font-sans font-normal">
                  {selectedMobileItem?.name ?? t("menu")}
                </span>
              </Drawer.Trigger>
            </div>
          </div>
        </div>

        <Drawer.Portal>
          <Drawer.Backdrop
            className={cn(
              "fixed inset-x-0 bottom-0 z-[200] bg-blue-900/50 dark:bg-gray-1000/50 sm:hidden",
              isTranslationBannerVisible ? "top-24" : "top-header"
            )}
          />
          <Drawer.Viewport
            className={cn(
              "fixed inset-x-0 bottom-0 z-[201] overflow-hidden [--feed-drawer-width:min(18rem,calc(100vw-3.75rem))] sm:hidden",
              isTranslationBannerVisible ? "top-24" : "top-header"
            )}
          >
            <Drawer.Close
              className="absolute left-[calc(var(--feed-drawer-width)+0.5rem)] top-2 inline-flex size-11 items-center justify-center rounded-full border border-blue-400 bg-gray-0 text-lg text-blue-600 hover:bg-blue-400 dark:border-blue-400-dark dark:bg-gray-0-dark dark:text-blue-600-dark dark:hover:bg-blue-600"
              aria-label={t("close")}
            >
              <FontAwesomeIcon icon={faXmark} />
            </Drawer.Close>
            <Drawer.Popup className="absolute inset-y-0 left-0 flex w-[var(--feed-drawer-width)] max-w-full flex-col bg-gray-0 text-blue-900 shadow-xl transition-transform duration-200 data-[ending-style]:-translate-x-full data-[starting-style]:-translate-x-full dark:bg-gray-0-dark dark:text-blue-900-dark">
              <Drawer.Content className="flex h-full min-h-0 flex-col">
                <Drawer.Title className="sr-only">{t("menu")}</Drawer.Title>
                <ScrollArea.Root className="min-h-0 flex-1 overflow-hidden">
                  <ScrollArea.Viewport
                    data-base-ui-swipe-ignore
                    className="h-full overscroll-contain [-webkit-overflow-scrolling:touch] [touch-action:pan-y]"
                  >
                    <ScrollArea.Content className="p-2">
                      <SidebarMenu
                        sections={sidebarSections}
                        seeAllCategoriesLabel={t("seeAllCategories")}
                        onItemSelect={() => setIsMobileDrawerOpen(false)}
                        className="flex w-full flex-col gap-y-1.5 p-1"
                      />
                    </ScrollArea.Content>
                  </ScrollArea.Viewport>
                  <ScrollArea.Scrollbar className="flex w-2 justify-center bg-transparent p-px opacity-0 transition-opacity data-[hovering]:opacity-100 data-[scrolling]:opacity-100">
                    <ScrollArea.Thumb className="w-1 rounded-full bg-blue-500/70 dark:bg-blue-500-dark/70" />
                  </ScrollArea.Scrollbar>
                </ScrollArea.Root>
              </Drawer.Content>
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>

      <DesktopSidebar
        isTranslationBannerVisible={isTranslationBannerVisible}
        sections={sidebarSections}
        seeAllCategoriesLabel={t("seeAllCategories")}
      />
    </>
  );
};

const DesktopSidebar: FC<{
  isTranslationBannerVisible: boolean;
  sections: SidebarSection[];
  seeAllCategoriesLabel: string;
}> = ({ isTranslationBannerVisible, sections, seeAllCategoriesLabel }) => {
  const stickyTopClass = isTranslationBannerVisible
    ? "sm:top-20"
    : "sm:top-header";
  const maxHeightClass = isTranslationBannerVisible
    ? "max-h-[calc(100vh-5rem)]"
    : "max-h-[calc(100vh-3rem)]";

  return (
    <div className="hidden border-r border-blue-400 bg-gray-0/70 backdrop-blur-md dark:border-blue-700 dark:bg-gray-0-dark/70 sm:static sm:block sm:min-h-[calc(100vh-3rem)]">
      <div className={cn("sticky", stickyTopClass)}>
        <ScrollArea.Root className={cn("overflow-hidden", maxHeightClass)}>
          <ScrollArea.Viewport
            className={cn(
              "overscroll-contain [-webkit-overflow-scrolling:touch] [touch-action:pan-y]",
              maxHeightClass
            )}
          >
            <ScrollArea.Content className="p-3">
              <SidebarMenu
                sections={sections}
                seeAllCategoriesLabel={seeAllCategoriesLabel}
                className="w-56 p-1 lg:w-64"
              />
            </ScrollArea.Content>
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar className="flex w-2 justify-center bg-transparent p-px opacity-0 transition-opacity data-[hovering]:opacity-100 data-[scrolling]:opacity-100">
            <ScrollArea.Thumb className="w-1 rounded-full bg-blue-500/70 dark:bg-blue-500-dark/70" />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>
      </div>
    </div>
  );
};

const SidebarMenu: FC<SidebarMenuProps> = ({
  sections,
  onItemSelect,
  className,
}) => {
  const [collapsedSections, setCollapsedSections] = useState<
    Set<SidebarSectionType>
  >(new Set());

  const toggleSection = (sectionType: SidebarSectionType) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionType)) {
        next.delete(sectionType);
      } else {
        next.add(sectionType);
      }
      return next;
    });
  };

  return (
    <div
      className={cn(
        "relative z-10 flex flex-col gap-y-1.5 overflow-hidden",
        className
      )}
    >
      {sections
        .filter(({ items }) => items.length > 0)
        .map(({ type: sectionType, title, items }) => {
          const isCollapsed =
            sectionType !== null && collapsedSections.has(sectionType);
          return (
            <Fragment key={`menu-${sectionType}`}>
              {title && sectionType !== null && (
                <button
                  onClick={() => toggleSection(sectionType)}
                  className="mt-1 flex h-8 w-full items-center justify-between rounded bg-blue-200 px-2.5 text-xs font-bold uppercase leading-4 text-gray-500 dark:bg-blue-200-dark dark:text-gray-500-dark"
                >
                  {title}
                  <FontAwesomeIcon
                    icon={faChevronUp}
                    className={cn(
                      "text-sm transition-transform duration-200",
                      isCollapsed && "rotate-180"
                    )}
                  />
                </button>
              )}
              {!isCollapsed &&
                (sectionType === "hot_categories" ? (
                  <div className="grid w-full grid-cols-3 gap-x-2 gap-y-1 py-1 text-center">
                    {items.map(({ name, emoji, onClick, url, isActive }) => (
                      <Link
                        key={url}
                        href={url}
                        onClick={() => {
                          onClick?.();
                          onItemSelect?.();
                        }}
                        className={cn(
                          "flex min-h-[60px] min-w-0 flex-col items-center justify-center gap-1 rounded py-2 no-underline transition-colors",
                          isActive
                            ? "bg-blue-800 dark:bg-blue-800-dark"
                            : "hover:bg-blue-200 dark:hover:bg-blue-200-dark"
                        )}
                      >
                        <div
                          className={cn(
                            "text-base font-bold leading-none",
                            isActive
                              ? "text-gray-0 dark:text-gray-200-dark"
                              : "text-olive-800 dark:text-olive-800-dark"
                          )}
                        >
                          {emoji}
                        </div>
                        <div
                          className={cn(
                            "w-full min-w-0 hyphens-manual whitespace-normal text-center text-[10px] font-medium leading-3 [overflow-wrap:anywhere] [text-wrap:balance] sm:text-[9.5px] lg:text-[10.5px]",
                            isActive
                              ? "text-gray-0 dark:text-gray-200-dark"
                              : "text-blue-800 dark:text-blue-800-dark"
                          )}
                        >
                          {name}
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  items.map(({ name, emoji, onClick, url, isActive }, idx) => (
                    <TopicItem
                      key={`menu-${sectionType}-${idx}`}
                      text={name}
                      emoji={emoji}
                      href={url}
                      onClick={() => {
                        onClick?.();
                        onItemSelect?.();
                      }}
                      isActive={isActive ?? false}
                      variant="sidebar"
                    />
                  ))
                ))}
            </Fragment>
          );
        })}
    </div>
  );
};

export default FeedSidebar;
