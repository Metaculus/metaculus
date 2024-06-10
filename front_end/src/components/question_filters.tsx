"use client";
import { faCircleXmark } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC, useMemo } from "react";

import {
  getDropdownSortOptions,
  getFilterChipColor,
  getMainOrderOptions,
  getQuestionsFilters,
  getUserSortOptions,
} from "@/app/(main)/questions/helpers/filters";
import PopoverFilter from "@/components/popover_filter";
import { FilterReplaceInfo } from "@/components/popover_filter/types";
import SearchInput from "@/components/search_input";
import ButtonGroup from "@/components/ui/button_group";
import Chip from "@/components/ui/chip";
import Select from "@/components/ui/select";
import {
  POST_GUESSED_BY_FILTER,
  POST_ORDER_BY_FILTER,
  POST_STATUS_FILTER,
  POST_TEXT_SEARCH_FILTER,
} from "@/constants/posts_feed";
import { useAuth } from "@/contexts/auth_context";
import useSearchInputState from "@/hooks/use_search_input_state";
import useSearchParams from "@/hooks/use_search_params";
import { Category, Tag } from "@/types/projects";
import { QuestionOrder } from "@/types/question";

type ActiveFilter = {
  id: string;
  label: string;
  value: string;
};

const DEFAULT_ORDER = QuestionOrder.ActivityDesc;
const OPEN_STATUS_FILTERS = [
  QuestionOrder.PublishTimeDesc,
  QuestionOrder.WeeklyMovementDesc,
  QuestionOrder.LastPredictionTimeDesc,
  QuestionOrder.LastPredictionTimeDesc,
  QuestionOrder.DivergenceDesc,
];
const GUESSED_BY_FILTERS = [
  QuestionOrder.LastPredictionTimeAsc,
  QuestionOrder.LastPredictionTimeDesc,
  QuestionOrder.DivergenceDesc,
];

type Props = {
  categories: Category[];
  tags: Tag[];
};

const QuestionFilters: FC<Props> = ({ categories, tags }) => {
  const t = useTranslations();
  const {
    params,
    setParam,
    deleteParam,
    deleteParams,
    replaceParams,
    navigateToSearchParams,
  } = useSearchParams();
  const { user } = useAuth();

  const [search, setSearch] = useSearchInputState(POST_TEXT_SEARCH_FILTER);
  const eraseSearch = () => {
    setSearch("");
  };

  const order = (params.get(POST_ORDER_BY_FILTER) ??
    DEFAULT_ORDER) as QuestionOrder;
  const mainSortOptions = useMemo(() => getMainOrderOptions(t), [t]);
  const userPredictionSortOptions = useMemo(() => getUserSortOptions(t), [t]);
  const dropdownSortOptions = useMemo(
    () => getDropdownSortOptions(t, !!user),
    [t, user]
  );
  const [popoverFilters, activeFilters] = useMemo(() => {
    const filters = getQuestionsFilters({ tags, user, t, params, categories });
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
  }, [categories, params, t, tags, user]);
  const handleOrderChange = (order: QuestionOrder) => {
    const withNavigation = false;

    clearPopupFilters(withNavigation);

    if (order === DEFAULT_ORDER) {
      deleteParam(POST_ORDER_BY_FILTER, withNavigation);
    } else {
      setParam(POST_ORDER_BY_FILTER, order, withNavigation);
    }

    if (OPEN_STATUS_FILTERS.includes(order)) {
      setParam(POST_STATUS_FILTER, "open", withNavigation);
    }

    if (!!user && GUESSED_BY_FILTERS.includes(order)) {
      setParam(POST_GUESSED_BY_FILTER, user.id.toString(), withNavigation);
    }

    if (order === QuestionOrder.ResolveTimeAsc) {
      setParam(POST_STATUS_FILTER, "open", withNavigation);
    }

    navigateToSearchParams();
  };

  const handlePopOverFilterChange = (
    filterId: string,
    optionValue: string | string[] | null,
    replaceInfo?: FilterReplaceInfo
  ) => {
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
          />
          {!!user && (
            <div className="hidden flex-row items-center text-gray-900 dark:text-gray-900-dark lg:flex">
              <span className="px-2 text-sm">{t("myPredictions")}: </span>
              <ButtonGroup
                value={order}
                buttons={userPredictionSortOptions}
                onChange={handleOrderChange}
                variant="tertiary"
              />
            </div>
          )}
          <div className="flex grow justify-end gap-3">
            <Select
              className="rounded-full"
              onChange={handleOrderChange}
              options={dropdownSortOptions}
              value={order || DEFAULT_ORDER}
              label="More"
            />
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

export default QuestionFilters;
