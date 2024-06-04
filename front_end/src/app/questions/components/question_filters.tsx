"use client";
import classNames from "classnames";
import { useTranslations } from "next-intl";
import { FC, useEffect, useMemo, useState } from "react";

import {
  QUESTION_STATUS_LABEL_MAP,
  QUESTION_TYPE_LABEL_MAP,
} from "@/app/questions/constants/filters";
import {
  ACCESS_FILTER,
  AUTHOR_FILTER,
  CATEGORIES_FILTER,
  COMMENTED_BY_FILTER,
  GUESSED_BY_FILTER,
  NOT_GUESSED_BY_FILTER,
  ORDER_PARAM,
  QUESTION_TYPE_FILTER,
  STATUS_FILTER,
  TAGS_FILTER,
  TEXT_SEARCH_FILTER,
  UPVOTED_BY_FILTER,
} from "@/app/questions/constants/query_params";
import PopoverFilter from "@/components/popover_filter";
import {
  FilterOptionType,
  FilterReplaceInfo,
  FilterSection,
} from "@/components/popover_filter/types";
import SearchInput from "@/components/search_input";
import ButtonGroup, { GroupButton } from "@/components/ui/button_group";
import Select, { SelectOption } from "@/components/ui/select";
import { useAuth } from "@/contexts/auth_context";
import useDebounce from "@/hooks/use_debounce";
import useSearchParams from "@/hooks/use_search_params";
import { Category, Tag } from "@/types/projects";
import { QuestionOrder, QuestionStatus, QuestionType } from "@/types/question";
import { CurrentUser } from "@/types/users";

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

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  useEffect(() => {
    if (debouncedSearch) {
      setParam(TEXT_SEARCH_FILTER, debouncedSearch);
    } else {
      deleteParam(TEXT_SEARCH_FILTER);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);
  const eraseSearch = () => {
    setSearch("");
    deleteParam(TEXT_SEARCH_FILTER);
  };

  const order = (params.get(ORDER_PARAM) ?? DEFAULT_ORDER) as QuestionOrder;
  const mainSortOptions = useMemo(() => getMainOrderOptions(t), [t]);
  const userPredictionSortOptions = useMemo(() => getUserSortOptions(t), [t]);
  const dropdownSortOptions = useMemo(
    () => getDropdownSortOptions(t, !!user),
    [t, user]
  );
  const popoverFilters = useMemo(
    () => getFilters({ tags, user, t, params, categories }),
    [categories, params, t, tags, user]
  );
  const handleOrderChange = (order: QuestionOrder) => {
    const withNavigation = false;

    clearPopupFilters(withNavigation);

    if (order === DEFAULT_ORDER) {
      deleteParam(ORDER_PARAM, withNavigation);
    } else {
      setParam(ORDER_PARAM, order, withNavigation);
    }

    if (OPEN_STATUS_FILTERS.includes(order)) {
      setParam(STATUS_FILTER, "open", withNavigation);
    }

    if (!!user && GUESSED_BY_FILTERS.includes(order)) {
      setParam(GUESSED_BY_FILTER, user.id.toString(), withNavigation);
    }

    if (order === QuestionOrder.ResolveTimeAsc) {
      setParam(STATUS_FILTER, "open", withNavigation);
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
    deleteParams(
      popoverFilters.map((filter) => filter.id),
      withNavigation
    );
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
            <div className="hidden flex-row items-center text-metac-gray-900 lg:flex dark:text-metac-gray-900-dark">
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
            />
          </div>
        </div>
      </div>
    </div>
  );
};

function getFilters({
  tags,
  user,
  t,
  params,
  categories,
}: {
  t: ReturnType<typeof useTranslations>;
  params: URLSearchParams;
  categories: Category[];
  tags: Tag[];
  user: CurrentUser | null;
}): FilterSection[] {
  const filters: FilterSection[] = [
    {
      id: QUESTION_TYPE_FILTER,
      title: t("questionType"),
      type: FilterOptionType.MultiChip,
      options: Object.values(QuestionType).map((type) => ({
        label: QUESTION_TYPE_LABEL_MAP[type],
        value: type,
        active: params.getAll(QUESTION_TYPE_FILTER).includes(type),
      })),
    },
    {
      id: STATUS_FILTER,
      title: t("questionStatus"),
      type: FilterOptionType.MultiChip,
      options: Object.values(QuestionStatus).map((status) => ({
        label: QUESTION_STATUS_LABEL_MAP[status],
        value: status,
        active: params.getAll(STATUS_FILTER).includes(status),
      })),
    },
    {
      id: CATEGORIES_FILTER,
      title: t("category"),
      type: FilterOptionType.Combobox,
      options: categories.map((category) => ({
        label: category.name,
        value: category.slug,
        active: params.getAll(CATEGORIES_FILTER).includes(category.slug),
      })),
      chipColor: "olive",
    },
    {
      id: TAGS_FILTER,
      title: t("tags"),
      type: FilterOptionType.Combobox,
      options: tags.map((tag) => ({
        label: tag.name,
        value: tag.slug,
        active: params.getAll(TAGS_FILTER).includes(tag.slug),
      })),
      chipColor: "blue",
      chipFormat: (value) => t("tagFilter", { tag: value.toLowerCase() }),
      shouldEnforceSearch: true,
    },
  ];

  if (user) {
    filters.push({
      id: "userFilters",
      title: t("myParticipation"),
      type: FilterOptionType.ToggleChip,
      options: [
        {
          id: GUESSED_BY_FILTER,
          label: t("predicted"),
          value: user.id.toString(),
          active: !!params.get(GUESSED_BY_FILTER),
        },
        {
          id: NOT_GUESSED_BY_FILTER,
          label: t("notPredicted"),
          value: user.id.toString(),
          active: !!params.get(NOT_GUESSED_BY_FILTER),
        },
        {
          id: AUTHOR_FILTER,
          label: t("authored"),
          value: user.id.toString(),
          active: !!params.get(AUTHOR_FILTER),
        },
        {
          id: UPVOTED_BY_FILTER,
          label: t("upvoted"),
          value: user.id.toString(),
          active: !!params.get(UPVOTED_BY_FILTER),
        },
        {
          id: COMMENTED_BY_FILTER,
          label: t("moderating"),
          value: user.id.toString(),
          active: !!params.get(COMMENTED_BY_FILTER),
        },
      ],
    });
  }

  filters.push({
    id: ACCESS_FILTER,
    title: t("visibility"),
    type: FilterOptionType.ToggleChip,
    options: [
      {
        id: ACCESS_FILTER,
        label: t("public"),
        value: "public",
        active: params.get(ACCESS_FILTER) === "public",
      },
      {
        id: ACCESS_FILTER,
        label: t("private"),
        value: "private",
        active: params.get(ACCESS_FILTER) === "private",
      },
    ],
  });

  return filters;
}

function getMainOrderOptions(
  t: ReturnType<typeof useTranslations>
): GroupButton<QuestionOrder>[] {
  return [
    {
      id: QuestionOrder.ActivityDesc,
      label: t("hot"),
    },
    {
      id: QuestionOrder.WeeklyMovementDesc,
      label: t("movers"),
    },
    {
      id: QuestionOrder.PublishTimeDesc,
      label: t("new"),
    },
  ];
}

function getUserSortOptions(
  t: ReturnType<typeof useTranslations>
): GroupButton<QuestionOrder>[] {
  return [
    {
      label: t("oldest"),
      id: QuestionOrder.LastPredictionTimeAsc,
    },
    {
      label: t("newest"),
      id: QuestionOrder.LastPredictionTimeDesc,
    },
    {
      label: t("divergence"),
      id: QuestionOrder.DivergenceDesc,
    },
  ];
}

function getDropdownSortOptions(
  t: ReturnType<typeof useTranslations>,
  isAuthenticated: boolean
): SelectOption<QuestionOrder>[] {
  return [
    { value: QuestionOrder.VotesDesc, label: t("mostUpvotes") },
    { value: QuestionOrder.CommentCountDesc, label: t("mostComments") },
    {
      value: QuestionOrder.PredictionCountDesc,
      label: t("mostPredictions"),
    },
    { value: QuestionOrder.CloseTimeAsc, label: t("closingSoon") },
    { value: QuestionOrder.ResolveTimeAsc, label: t("resolvingSoon") },
    ...(isAuthenticated
      ? [
          {
            value: QuestionOrder.UnreadCommentCountDesc,
            label: t("unreadComments"),
          },
          {
            value: QuestionOrder.LastPredictionTimeAsc,
            label: t("oldestPredictions"),
            className: classNames("block lg:hidden"),
          },
          {
            value: QuestionOrder.LastPredictionTimeDesc,
            label: t("newestPredictions"),
            className: classNames("block lg:hidden"),
          },
          {
            value: QuestionOrder.DivergenceDesc,
            label: t("myDivergence"),
            className: classNames("block lg:hidden"),
          },
        ]
      : []),
  ];
}

export default QuestionFilters;
