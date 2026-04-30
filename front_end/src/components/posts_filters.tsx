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
import PopoverFilter from "@/components/popover_filter";
import {
  FilterReplaceInfo,
  FilterSection,
} from "@/components/popover_filter/types";
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
  POST_WITHDRAWN_FILTER,
} from "@/constants/posts_feed";
import { useFeedLayout } from "@/contexts/feed_layout_context";
import { useGlobalSearchContext } from "@/contexts/global_search_context";
import useSearchParams from "@/hooks/use_search_params";
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
}) => {
  const t = useTranslations();
  const { layout, setLayout } = useFeedLayout();
  const actionRailRef = useRef<HTMLDivElement>(null);
  const [actionRailWidth, setActionRailWidth] = useState(0);
  const {
    params,
    setParam,
    deleteParam,
    deleteParams,
    replaceParams,
    navigateToSearchParams,
  } = useSearchParams();
  defaultOrder = defaultOrder ?? QuestionOrder.ActivityDesc;

  const { globalSearch, updateGlobalSearch, setModifySearchParams } =
    useGlobalSearchContext();

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
    setModifySearchParams(true);

    return () => {
      setModifySearchParams(false);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const eraseSearch = () => {
    updateGlobalSearch("");
  };

  const order = (params.get(POST_ORDER_BY_FILTER) ??
    defaultOrder) as QuestionOrder;
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

  // reset page param after applying new filters
  useEffect(() => {
    deleteParam(POST_PAGE_FILTER, false);
  }, [filters, deleteParam]);

  const handleOrderChange = (order: QuestionOrder) => {
    const withNavigation = false;

    clearPopupFilters(withNavigation);

    if (order === defaultOrder && !alwaysKeepOrderInUrl) {
      deleteParam(POST_ORDER_BY_FILTER, withNavigation);
    } else {
      setParam(POST_ORDER_BY_FILTER, order, withNavigation);
    }

    if (onOrderChange) onOrderChange(order, setParam);

    navigateToSearchParams();
  };

  const handlePopOverFilterChange = (
    filterId: string,
    optionValue: string | string[] | null,
    replaceInfo?: FilterReplaceInfo,
    extraValues?: Record<string, string>
  ) => {
    onPopOverFilterChange?.(
      { filterId, optionValue, replaceInfo },
      order,
      deleteParam
    );

    if (replaceInfo) {
      const { optionId, replaceIds } = replaceInfo;

      // Globally handle Withdrawn conditions
      if (optionId === POST_WITHDRAWN_FILTER) {
        extraValues = { ...(extraValues ?? {}), [POST_STATUS_FILTER]: "open" };
      }

      if (!optionValue) {
        deleteParam(optionId);
        return;
      }

      replaceParams(replaceIds, [
        { name: optionId, value: optionValue },
        ...(extraValues
          ? Object.entries(extraValues).map(([key, value]) => ({
              name: key,
              value,
            }))
          : []),
      ]);
      return;
    }

    if (!optionValue) {
      deleteParam(filterId);
      return;
    }

    setParam(filterId, optionValue);
  };
  const clearPopupFilters = (withNavigation = true) => {
    sendAnalyticsEvent("feedFiltersCleared");
    const filtersToDelete = popoverFilters.reduce<string[]>(
      (filterIds, filter) => {
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
      },
      []
    );
    deleteParams(filtersToDelete, withNavigation);
  };
  const removeFilter = (filterId: string, filterValue: string) => {
    deleteParam(filterId, true, filterValue);
  };
  const railFadeWidth = actionRailWidth ? 48 : 0;

  return (
    <div className={className}>
      <div className="relative">
        <div
          className="-ml-[var(--posts-filter-rail-bleed-left,0px)] w-[calc(100%+var(--posts-filter-rail-bleed-left,0px))] overflow-x-auto no-scrollbar"
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
                className="shrink-0 border-transparent max-sm:px-3 max-sm:text-sm max-sm:leading-none"
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
          className="absolute inset-y-0 right-0 z-10 flex items-center gap-1.5 pl-1.5 sm:gap-3 sm:pl-2"
        >
          {dropdownSortOptions && (
            <div className="flex items-stretch">
              <Listbox
                buttonVariant={hasActiveDropdownSort ? "secondary" : "tertiary"}
                className={cn(
                  "rounded-full max-sm:px-2 max-sm:py-1 max-sm:text-xs",
                  hasActiveDropdownSort && "rounded-r-none border-r-0 pr-1.5"
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
            buttonClassName="max-md:shrink-0 max-md:p-0 max-md:[&.rounded-r-none]:rounded-l-full max-md:[&:not(.rounded-r-none)]:rounded-full max-sm:size-[26px] sm:max-md:size-8"
            clearButtonClassName="max-sm:px-1.5 max-sm:py-1"
          />
          <SearchInput
            value={globalSearch}
            onChange={(e) => {
              debouncedAnalyticsEvent();
              deleteParam(POST_PAGE_FILTER, true);
              updateGlobalSearch(e.target.value);
            }}
            onErase={eraseSearch}
            placeholder={t("questionSearchPlaceholder")}
            className="hidden md:flex"
            collapsible
          />
          {!forceLayout && (
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
      {!!activeFilters.length && (
        <div className="mt-2 flex flex-wrap gap-1.5 sm:gap-3">
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
