"use client";

import { faCircleXmark } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { sendGAEvent } from "@next/third-parties/google";
import { useTranslations } from "next-intl";
import { FC, useMemo } from "react";

import { getFilterChipColor } from "@/app/(main)/questions/helpers/filters";
import PopoverFilter from "@/components/popover_filter";
import {
  FilterReplaceInfo,
  FilterSection,
} from "@/components/popover_filter/types";
import SearchInput from "@/components/search_input";
import ButtonGroup, { GroupButton } from "@/components/ui/button_group";
import Chip from "@/components/ui/chip";
import Listbox, { SelectOption } from "@/components/ui/listbox";
import {
  POST_ORDER_BY_FILTER,
  POST_TEXT_SEARCH_FILTER,
} from "@/constants/posts_feed";
import useSearchInputState from "@/hooks/use_search_input_state";
import useSearchParams from "@/hooks/use_search_params";
import { QuestionOrder } from "@/types/question";

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
};

const PostsFilters: FC<Props> = ({
  defaultOrder,
  filters,
  mainSortOptions,
  sortOptions: dropdownSortOptions,
  onPopOverFilterChange,
  onOrderChange,
  inputConfig,
}) => {
  const t = useTranslations();
  const {
    params,
    setParam,
    deleteParam,
    deleteParams,
    replaceParams,
    navigateToSearchParams,
  } = useSearchParams();
  defaultOrder = defaultOrder ?? QuestionOrder.ActivityDesc;

  const [search, setSearch] = useSearchInputState(
    POST_TEXT_SEARCH_FILTER,
    inputConfig
  );
  const eraseSearch = () => {
    setSearch("");
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
  const handleOrderChange = (order: QuestionOrder) => {
    const withNavigation = false;

    clearPopupFilters(withNavigation);

    if (order === defaultOrder) {
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
    replaceInfo?: FilterReplaceInfo
  ) => {
    onPopOverFilterChange?.(
      { filterId, optionValue, replaceInfo },
      deleteParam
    );

    if (replaceInfo) {
      const { optionId, replaceIds } = replaceInfo;

      if (!optionValue) {
        deleteParam(optionId);
        return;
      }

      replaceParams(replaceIds, [{ name: optionId, value: optionValue }]);
      return;
    }

    if (!optionValue) {
      deleteParam(filterId);
      return;
    }

    setParam(filterId, optionValue);
  };
  const clearPopupFilters = (withNavigation = true) => {
    sendGAEvent("event", "feedFiltersCleared");
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
    <div>
      <div className="block">
        <SearchInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onErase={eraseSearch}
          placeholder={t("questionSearchPlaceholder")}
        />
        <div className="mx-0 my-3 flex flex-wrap items-center justify-between gap-2">
          <ButtonGroup
            value={order}
            buttons={mainSortOptions}
            onChange={handleOrderChange}
            variant="tertiary"
            onClick={(buttonLabel) =>
              sendGAEvent("event", "feedShortcutClick", { value: buttonLabel })
            }
          />
          <div className="flex grow justify-end gap-3">
            {dropdownSortOptions && (
              <Listbox
                className="rounded-full"
                onChange={handleOrderChange}
                onClick={(value) =>
                  sendGAEvent("event", "feedSortClick", { value })
                }
                options={dropdownSortOptions}
                value={order || defaultOrder}
                label="More"
              />
            )}
            <PopoverFilter
              filters={popoverFilters}
              onChange={handlePopOverFilterChange}
              panelClassName="w-[500px]"
              onClear={clearPopupFilters}
              fullScreenEnabled
            />
          </div>
        </div>
      </div>
      {!!activeFilters.length && (
        <div className="mb-3 flex flex-wrap gap-3">
          {activeFilters.map(({ id, label, value }) => (
            <Chip
              color={getFilterChipColor(id)}
              variant="outlined"
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
