"use client";
import { useTranslations } from "next-intl";
import { FC, useEffect, useMemo, useState } from "react";

import {
  QUESTION_STATUS_LABEL_MAP,
  QUESTION_TYPE_LABEL_MAP,
} from "@/app/questions/constants/filters";
import {
  CATEGORIES_FILTER,
  QUESTION_TYPE_FILTER,
  STATUS_FILTER,
  TAGS_FILTER,
  TEXT_SEARCH_FILTER,
} from "@/app/questions/constants/query_params";
import PopoverFilter from "@/components/popover_filter";
import {
  FilterOptionType,
  FilterSection,
} from "@/components/popover_filter/types";
import SearchInput from "@/components/search_input";
import useDebounce from "@/hooks/use_debounce";
import useSearchParams from "@/hooks/use_search_params";
import { Category, Tag } from "@/types/projects";
import { QuestionStatus, QuestionType } from "@/types/question";

type Props = {
  categories: Category[];
  tags: Tag[];
};

const QuestionFilters: FC<Props> = ({ categories, tags }) => {
  const t = useTranslations();
  const { params, setParam, deleteParam, deleteParams } = useSearchParams();

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

  const popoverFilters: FilterSection[] = useMemo(
    () => [
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
    ],
    [categories, params, t, tags]
  );
  const handlePopOverFilterChange = (
    filterId: string,
    optionValue: string | string[]
  ) => {
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

export default QuestionFilters;
