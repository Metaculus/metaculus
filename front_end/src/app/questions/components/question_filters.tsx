"use client";
import { useTranslations } from "next-intl";
import { FC, useEffect, useMemo, useState } from "react";

import {
  QUESTION_STATUS_LABEL_MAP,
  QUESTION_TYPE_LABEL_MAP,
} from "@/app/questions/constants/filters";
import {
  CATEGORY_FILTER,
  QUESTION_TYPE_FILTER,
  STATUS_FILTER,
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
import { Category } from "@/types/projects";
import { QuestionStatus, QuestionType } from "@/types/question";

type Props = {
  categories: Category[];
};

const QuestionFilters: FC<Props> = ({ categories }) => {
  const t = useTranslations();
  const { params, setParam, deleteParam } = useSearchParams();

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
        title: "Question Type",
        type: FilterOptionType.MultiChip,
        options: Object.values(QuestionType).map((type) => ({
          label: QUESTION_TYPE_LABEL_MAP[type],
          value: type,
          active: params.getAll(QUESTION_TYPE_FILTER).includes(type),
        })),
      },
      {
        id: STATUS_FILTER,
        title: "Question Status",
        type: FilterOptionType.MultiChip,
        options: Object.values(QuestionStatus).map((status) => ({
          label: QUESTION_STATUS_LABEL_MAP[status],
          value: status,
          active: params.getAll(STATUS_FILTER).includes(status),
        })),
      },
      {
        id: CATEGORY_FILTER,
        title: "Category",
        type: FilterOptionType.Combobox,
        options: categories.map((category) => ({
          label: category.name,
          value: category.slug,
          active: params.getAll(CATEGORY_FILTER).includes(category.slug),
        })),
        chipColor: "olive",
      },
    ],
    [categories, params]
  );
  const handlePopOverFilterChange = (
    filterId: string,
    optionValue: string | string[]
  ) => {
    setParam(filterId, optionValue);
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
          />
        </div>
      </div>
    </div>
  );
};

export default QuestionFilters;
