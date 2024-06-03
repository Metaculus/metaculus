"use client";
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
import { useAuth } from "@/contexts/auth_context";
import useDebounce from "@/hooks/use_debounce";
import useSearchParams from "@/hooks/use_search_params";
import { Category, Tag } from "@/types/projects";
import { QuestionStatus, QuestionType } from "@/types/question";
import { CurrentUser } from "@/types/users";

type Props = {
  categories: Category[];
  tags: Tag[];
};

const QuestionFilters: FC<Props> = ({ categories, tags }) => {
  const t = useTranslations();
  const { params, setParam, deleteParam, deleteParams, replaceParams } =
    useSearchParams();
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

  const popoverFilters = useMemo(
    () => getFilters({ tags, user, t, params, categories }),
    [categories, params, t, tags, user]
  );
  const handlePopOverFilterChange = (
    filterId: string,
    optionValue: string | string[] | null,
    replaceInfo?: FilterReplaceInfo
  ) => {
    if (!optionValue) {
      deleteParam(filterId);
      return;
    }

    if (replaceInfo) {
      const { optionId, replaceIds } = replaceInfo;

      replaceParams(replaceIds, [{ name: optionId, value: optionValue }]);
      return;
    }

    setParam(filterId, optionValue);
  };
  const handlePopOverClearFilters = () => {
    deleteParams(popoverFilters.map((filter) => filter.id));
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
        <div className="mx-0 my-3 flex flex-wrap justify-end gap-2">
          <PopoverFilter
            filters={popoverFilters}
            onChange={handlePopOverFilterChange}
            panelClassName="w-[500px]"
            onClear={handlePopOverClearFilters}
          />
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
          value: user.id,
          active: !!params.get(GUESSED_BY_FILTER),
        },
        {
          id: NOT_GUESSED_BY_FILTER,
          label: t("notPredicted"),
          value: user.id,
          active: !!params.get(NOT_GUESSED_BY_FILTER),
        },
        {
          id: AUTHOR_FILTER,
          label: t("authored"),
          value: user.id,
          active: !!params.get(AUTHOR_FILTER),
        },
        {
          id: UPVOTED_BY_FILTER,
          label: t("upvoted"),
          value: user.id,
          active: !!params.get(UPVOTED_BY_FILTER),
        },
        {
          id: COMMENTED_BY_FILTER,
          label: t("moderating"),
          value: user.id,
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

export default QuestionFilters;
