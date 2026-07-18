"use client";

import { faCircleXmark } from "@fortawesome/free-regular-svg-icons";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { debounce } from "lodash";
import { useTranslations } from "next-intl";
import {
  CSSProperties,
  FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { getFilterChipColor } from "@/app/(main)/questions/helpers/filters";
import { useFeedQuery } from "@/app/(main)/questions/hooks/use_feed_query";
import {
  deleteSearchParamValue,
  setSearchParamValue,
} from "@/app/(main)/questions/hooks/use_feed_query_params";
import PopoverFilter from "@/components/popover_filter";
import {
  FilterReplaceInfo,
  FilterSection,
} from "@/components/popover_filter/types";
import RichText from "@/components/rich_text";
import SearchInput from "@/components/search_input";
import Button from "@/components/ui/button";
import { GroupButton } from "@/components/ui/button_group";
import Chip from "@/components/ui/chip";
import LayoutSwitcher, { FeedLayout } from "@/components/ui/layout_switcher";
import Listbox, { SelectOption } from "@/components/ui/listbox";
import {
  POST_ORDER_BY_FILTER,
  POST_PAGE_FILTER,
  POST_STATUS_FILTER,
  POST_TEXT_SEARCH_FILTER,
  POST_WITHDRAWN_FILTER,
} from "@/constants/posts_feed";
import { useFeedLayout } from "@/contexts/feed_layout_context";
import { useBreakpoint } from "@/hooks/tailwind";
import { QuestionOrder } from "@/types/question";
import { sendAnalyticsEvent } from "@/utils/analytics";
import cn from "@/utils/core/cn";

import RandomButton from "./random_button";

type ActiveFilter = {
  id: string;
  label: string;
  value: string;
};

type Props = {
  defaultOrder?: QuestionOrder;
  filters: FilterSection[];
  mainSortOptions: GroupButton<QuestionOrder>[];
  sortOptions?: SelectOption<QuestionOrder>[];
  onPopOverFilterChange?: (
    change: {
      filterId: string;
      optionValue: string | string[] | null;
      replaceInfo?: FilterReplaceInfo;
    },
    order: QuestionOrder,
    deleteParam: (
      name: string,
      withNavigation?: boolean,
      value?: string
    ) => void
  ) => void;
  onOrderChange?: (
    order: QuestionOrder,
    setParam: (
      name: string,
      val: string | string[],
      withNavigation?: boolean
    ) => void
  ) => void;
  inputConfig?: { mode: "client" | "server"; debounceTime?: number };
  showRandomButton?: boolean;
  panelClassname?: string;
  alwaysKeepOrderInUrl?: boolean;
  className?: string;
  forceLayout?: FeedLayout;
  variant?: "full" | "mobileActions";
  hideMobileActions?: boolean;
};

const PostsFilters: FC<Props> = ({
  defaultOrder,
  filters,
  mainSortOptions,
  sortOptions: dropdownSortOptions,
  onPopOverFilterChange,
  onOrderChange,
  showRandomButton,
  panelClassname,
  alwaysKeepOrderInUrl,
  className,
  forceLayout,
  variant = "full",
  hideMobileActions = false,
}) => {
  const t = useTranslations();
  const isLargeScreen = useBreakpoint("sm");
  const { layout, setLayout } = useFeedLayout();
  const actionRailRef = useRef<HTMLDivElement>(null);
  const [actionRailWidth, setActionRailWidth] = useState(0);
  const { params, resultCount, setFilterParams, setSearchParams } =
    useFeedQuery();
  defaultOrder = defaultOrder ?? QuestionOrder.ActivityDesc;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedAnalyticsEvent = useCallback(
    debounce(() => {
      sendAnalyticsEvent("feedSearch", {
        event_category: "fromPostsFilter",
      });
    }, 2000),
    []
  );

  useEffect(() => {
    const actionRail = actionRailRef.current;

    if (!actionRail) {
      return;
    }

    const updateActionRailWidth = () => {
      setActionRailWidth(actionRail.offsetWidth);
    };

    updateActionRailWidth();

    const resizeObserver = new ResizeObserver(updateActionRailWidth);
    resizeObserver.observe(actionRail);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const order = (params.get(POST_ORDER_BY_FILTER) ??
    defaultOrder) as QuestionOrder;
  const submittedSearch = params.get(POST_TEXT_SEARCH_FILTER)?.trim() ?? "";
  const [searchDraft, setSearchDraft] = useState(submittedSearch);
  const hasActiveSearch = !!(searchDraft.trim() || submittedSearch);
  const searchResultCountLabel = resultCount
    ? `${resultCount.count.toLocaleString()}${resultCount.isLowerBound ? "+" : ""}`
    : null;
  const hasActiveDropdownSort =
    dropdownSortOptions?.some((o) => o.value === order) ?? false;

  const [popoverFilters, activeFilters] = useMemo(() => {
    const activeFilters: ActiveFilter[] = filters.flatMap((filterSection) =>
      filterSection.options
        .filter((o) => o.active)
        .map((o) => ({
          id: o.id ?? filterSection.id,
          label: o.label,
          value: o.value,
        }))
    );

    return [filters, activeFilters];
  }, [filters]);

  useEffect(() => {
    setSearchDraft(submittedSearch);
  }, [submittedSearch]);

  const getPopupFilterIds = useCallback(
    () =>
      popoverFilters.reduce<string[]>((filterIds, filter) => {
        const optionIds = filter.options.reduce<string[]>(
          (optionIds, option) => {
            if (option.id) {
              optionIds.push(option.id);
            }
            return optionIds;
          },
          []
        );

        filterIds.push(filter.id, ...optionIds);

        return filterIds;
      }, []),
    [popoverFilters]
  );

  const commitFilterParams = useCallback(
    (nextParams: URLSearchParams) => {
      nextParams.delete(POST_PAGE_FILTER);
      setFilterParams(nextParams);
    },
    [setFilterParams]
  );

  const commitSearchParams = useCallback(
    (search: string) => {
      const nextParams = new URLSearchParams(params);
      const trimmedSearch = search.trim();

      nextParams.delete(POST_PAGE_FILTER);

      if (trimmedSearch) {
        setSearchParamValue(nextParams, POST_TEXT_SEARCH_FILTER, trimmedSearch);
        if (!nextParams.get(POST_ORDER_BY_FILTER)) {
          setSearchParamValue(
            nextParams,
            POST_ORDER_BY_FILTER,
            QuestionOrder.RankDesc
          );
        }
      } else {
        nextParams.delete(POST_TEXT_SEARCH_FILTER);
        if (nextParams.get(POST_ORDER_BY_FILTER) === QuestionOrder.RankDesc) {
          nextParams.delete(POST_ORDER_BY_FILTER);
        }
      }

      setSearchParams(nextParams);
    },
    [params, setSearchParams]
  );

  const eraseSearch = useCallback(() => {
    setSearchDraft("");
    commitSearchParams("");
  }, [commitSearchParams]);

  const handleSearchSubmit = useCallback(
    (search: string) => {
      setSearchDraft(search);
      commitSearchParams(search);
    },
    [commitSearchParams]
  );

  const handleOrderChange = (order: QuestionOrder) => {
    const nextParams = new URLSearchParams(params);

    getPopupFilterIds().forEach((filterId) => nextParams.delete(filterId));

    if (order === defaultOrder && !alwaysKeepOrderInUrl) {
      nextParams.delete(POST_ORDER_BY_FILTER);
    } else {
      setSearchParamValue(nextParams, POST_ORDER_BY_FILTER, order);
    }

    if (onOrderChange) {
      onOrderChange(order, (name, value) =>
        setSearchParamValue(nextParams, name, value)
      );
    }

    commitFilterParams(nextParams);
  };

  const handlePopOverFilterChange = (
    filterId: string,
    optionValue: string | string[] | null,
    replaceInfo?: FilterReplaceInfo,
    extraValues?: Record<string, string>
  ) => {
    const nextParams = new URLSearchParams(params);

    onPopOverFilterChange?.(
      { filterId, optionValue, replaceInfo },
      order,
      (name, _withNavigation, value) =>
        deleteSearchParamValue(nextParams, name, value)
    );

    if (replaceInfo) {
      const { optionId, replaceIds } = replaceInfo;

      // Globally handle Withdrawn conditions
      if (optionId === POST_WITHDRAWN_FILTER) {
        extraValues = { ...(extraValues ?? {}), [POST_STATUS_FILTER]: "open" };
      }

      if (!optionValue) {
        nextParams.delete(optionId);
        commitFilterParams(nextParams);
        return;
      }

      replaceIds.forEach((id) => nextParams.delete(id));
      setSearchParamValue(nextParams, optionId, optionValue);
      Object.entries(extraValues ?? {}).forEach(([key, value]) => {
        setSearchParamValue(nextParams, key, value);
      });
      commitFilterParams(nextParams);
      return;
    }

    if (!optionValue) {
      nextParams.delete(filterId);
      commitFilterParams(nextParams);
      return;
    }

    setSearchParamValue(nextParams, filterId, optionValue);
    commitFilterParams(nextParams);
  };

  const clearPopupFilters = () => {
    sendAnalyticsEvent("feedFiltersCleared");
    const nextParams = new URLSearchParams(params);
    getPopupFilterIds().forEach((filterId) => nextParams.delete(filterId));
    commitFilterParams(nextParams);
  };

  const removeFilter = (filterId: string, filterValue: string) => {
    const nextParams = new URLSearchParams(params);
    deleteSearchParamValue(nextParams, filterId, filterValue);
    commitFilterParams(nextParams);
  };
  const railFadeWidth = actionRailWidth ? 48 : 0;
  const usesMobileFeedChips = variant === "mobileActions";
  const feedChipBaseClasses =
    "border bg-gray-0 text-blue-800 dark:bg-gray-0-dark dark:text-blue-800-dark";
  const feedChipActiveClasses = "border-gray-900 dark:border-gray-900-dark";
  const feedChipInactiveClasses =
    "border-[#a9c0d699] dark:border-blue-500-dark/60";
  const feedIconChipInactiveClasses =
    "border-[#a9c0d666] dark:border-blue-500-dark/40";

  const actionControls = (
    <>
      {dropdownSortOptions && (
        <div className="flex shrink-0 items-stretch">
          <Listbox
            buttonVariant={hasActiveDropdownSort ? "secondary" : "tertiary"}
            className={cn(
              "whitespace-nowrap rounded-full max-sm:h-7 max-sm:px-3 max-sm:py-0 max-sm:text-sm max-sm:font-medium max-sm:leading-5",
              usesMobileFeedChips && feedChipBaseClasses,
              hasActiveDropdownSort && "rounded-r-none border-r-0 pr-1.5",
              usesMobileFeedChips &&
                (hasActiveDropdownSort
                  ? feedChipActiveClasses
                  : feedChipInactiveClasses)
            )}
            onChange={handleOrderChange}
            onClick={(value) =>
              sendAnalyticsEvent("feedSortClick", {
                event_category: value,
              })
            }
            options={dropdownSortOptions}
            value={order || defaultOrder}
            menuPosition="right"
            renderInPortal
            menuFitContent={isLargeScreen}
            preventParentScroll={variant === "mobileActions"}
            label={
              dropdownSortOptions.find((o) => o.value === order)
                ? `${t("sort")}: ${dropdownSortOptions.find((o) => o.value === order)?.label}`
                : t("sort")
            }
          />
          {hasActiveDropdownSort && (
            <Button
              variant="secondary"
              size="sm"
              className="rounded-l-none border-l-0 pl-1.5 pr-2 max-sm:px-1.5 max-sm:py-1"
              aria-label={t("clear")}
              onClick={() => handleOrderChange(defaultOrder)}
            >
              <FontAwesomeIcon
                icon={faXmark}
                className="text-xs text-salmon-600 dark:text-salmon-500"
              />
            </Button>
          )}
        </div>
      )}
      <PopoverFilter
        filters={popoverFilters}
        onChange={handlePopOverFilterChange}
        panelClassName={cn("w-[500px]", panelClassname)}
        onClear={clearPopupFilters}
        fullScreenEnabled
        hasActiveFilters={activeFilters.length > 0}
        iconOnlyBelowMd
        buttonClassName={cn(
          "max-md:shrink-0 max-md:p-0 max-md:[&.rounded-r-none]:rounded-l-full max-md:[&:not(.rounded-r-none)]:rounded-full max-sm:size-7 sm:max-md:size-8",
          usesMobileFeedChips && feedChipBaseClasses,
          usesMobileFeedChips &&
            (activeFilters.length > 0
              ? feedChipActiveClasses
              : feedIconChipInactiveClasses)
        )}
        clearButtonClassName="max-sm:pl-1 max-sm:pr-1.5 max-sm:py-1"
      />
    </>
  );

  if (variant === "mobileActions") {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        {actionControls}
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="relative">
        <div
          className="-ml-[var(--posts-filter-rail-bleed-left,0px)] w-[calc(100%+var(--posts-filter-rail-bleed-left,0px)+var(--posts-filter-rail-bleed-right,0px))] overflow-x-auto no-scrollbar"
          style={
            {
              maskImage: `linear-gradient(to right, black calc(100% - ${
                actionRailWidth + railFadeWidth
              }px), transparent calc(100% - ${actionRailWidth}px))`,
              WebkitMaskImage: `linear-gradient(to right, black calc(100% - ${
                actionRailWidth + railFadeWidth
              }px), transparent calc(100% - ${actionRailWidth}px))`,
            } as CSSProperties
          }
        >
          <div
            className="flex w-max gap-1.5 pl-[var(--posts-filter-rail-bleed-left,0px)] after:w-[var(--posts-filter-action-rail-width)] after:shrink-0 after:content-[''] sm:gap-2"
            style={
              {
                "--posts-filter-action-rail-width": `${actionRailWidth}px`,
              } as CSSProperties
            }
          >
            {mainSortOptions.map((button) => (
              <Button
                key={button.value}
                variant={button.value === order ? "primary" : "tertiary"}
                className={cn(
                  "shrink-0 max-sm:h-7 max-sm:px-3 max-sm:py-0 max-sm:text-sm max-sm:font-medium max-sm:leading-5",
                  usesMobileFeedChips &&
                    (button.value === order
                      ? "border-blue-800 bg-blue-800 text-gray-0 dark:border-blue-800-dark dark:bg-blue-800-dark dark:text-gray-200-dark"
                      : cn(feedChipBaseClasses, feedChipInactiveClasses)),
                  button.className
                )}
                size="md"
                onClick={() => {
                  handleOrderChange(button.value);
                  sendAnalyticsEvent("feedShortcutClick", {
                    event_category: button.label as string,
                  });
                }}
              >
                {button.label}
              </Button>
            ))}
          </div>
        </div>
        <div
          ref={actionRailRef}
          className={cn(
            "absolute inset-y-0 right-0 z-10 flex items-center gap-1.5 pl-1.5 sm:gap-3 sm:pl-2",
            hideMobileActions && "max-sm:hidden"
          )}
        >
          {actionControls}
          <SearchInput
            value={searchDraft}
            onChange={(e) => {
              debouncedAnalyticsEvent();
              setSearchDraft(e.target.value);
            }}
            onErase={eraseSearch}
            onSubmit={handleSearchSubmit}
            placeholder={t("questionSearchPlaceholder")}
            className="hidden md:flex"
            collapsible
          />
          {!forceLayout && !hasActiveSearch && (
            <LayoutSwitcher
              value={layout}
              onChange={setLayout}
              className="hidden lg:flex"
            />
          )}
          {showRandomButton && (
            <RandomButton
              variant="tertiary"
              className="hidden text-purple-700 dark:text-purple-700-dark md:flex"
            />
          )}
        </div>
      </div>

      {!!(submittedSearch || activeFilters.length) && (
        <div className="mt-2 flex flex-wrap gap-1.5 sm:gap-3">
          {submittedSearch && (
            <div className="flex items-center text-sm md:text-base">
              <RichText>
                {(tags) =>
                  t.rich(
                    searchResultCountLabel
                      ? "feedSearchResultsFor"
                      : "feedSearchResultsForWithoutCount",
                    {
                      ...tags,
                      count: searchResultCountLabel ?? "",
                      search: submittedSearch,
                    }
                  )
                }
              </RichText>
              <button type="button" onClick={eraseSearch}>
                <FontAwesomeIcon
                  icon={faXmark}
                  className="ml-1 text-blue-600 dark:text-blue-600-dark"
                />
              </button>
            </div>
          )}
          {activeFilters.map(({ id, label, value }) => (
            <Chip
              color={getFilterChipColor(id)}
              variant="outlined"
              className="rounded-full pl-1 [&>button]:max-sm:p-1 [&>button]:max-sm:text-xs [&>button]:max-sm:leading-3"
              key={`filter-chip-${id}-${value}`}
              onClick={() => removeFilter(id, value)}
            >
              {label}
              <FontAwesomeIcon
                icon={faCircleXmark}
                className="ml-1 text-salmon-600 dark:text-salmon-500"
              />
            </Chip>
          ))}
        </div>
      )}
    </div>
  );
};

export default PostsFilters;
