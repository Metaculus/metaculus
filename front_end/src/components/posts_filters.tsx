"use client";

import { faCircleXmark } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { debounce } from "lodash";
import { useTranslations } from "next-intl";
import { FC, useCallback, useEffect, useMemo } from "react";

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

  const eraseSearch = () => {
    updateGlobalSearch("");
  };

  const order = (params.get(POST_ORDER_BY_FILTER) ??
    defaultOrder) as QuestionOrder;

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

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-2">
        {mainSortOptions.map((button) => (
          <Button
            key={button.value}
            variant={button.value === order ? "primary" : "tertiary"}
            className="border-transparent"
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
        <div className="flex grow justify-end gap-3">
          {dropdownSortOptions && (
            <Listbox
              buttonVariant={
                dropdownSortOptions.some((o) => o.value === order)
                  ? "secondary"
                  : "tertiary"
              }
              className="rounded-full"
              onChange={handleOrderChange}
              onClick={(value) =>
                sendAnalyticsEvent("feedSortClick", {
                  event_category: value,
                })
              }
              options={dropdownSortOptions}
              value={order || defaultOrder}
              menuPosition="left"
              label={
                dropdownSortOptions.find((o) => o.value === order)
                  ? `${t("sort")}: ${dropdownSortOptions.find((o) => o.value === order)?.label}`
                  : t("sort")
              }
            />
          )}
          {mainSortOptions.length === 0 ? <div className="flex-1" /> : null}
          <PopoverFilter
            filters={popoverFilters}
            onChange={handlePopOverFilterChange}
            panelClassName={cn("w-[500px]", panelClassname)}
            onClear={clearPopupFilters}
            fullScreenEnabled
            hasActiveFilters={activeFilters.length > 0}
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
        <div className="mt-2 flex flex-wrap gap-3">
          {activeFilters.map(({ id, label, value }) => (
            <Chip
              color={getFilterChipColor(id)}
              variant="outlined"
              className="rounded-full pl-1"
              key={`filter-chip-${id}-${value}`}
              onClick={() => removeFilter(id, value)}
            >
              {label}
              <FontAwesomeIcon icon={faCircleXmark} className="ml-1" />
            </Chip>
          ))}
        </div>
      )}
    </div>
  );
};

export default PostsFilters;
