"use client";

import { useTranslations } from "next-intl";
import { ChangeEvent } from "react";

import ExpandableSearchInput from "@/components/expandable_search_input";
import useSearchInputState from "@/hooks/use_search_input_state";

import { TOURNAMENTS_SEARCH } from "../constants/query_params";

const TournamentsSearch: React.FC = () => {
  const t = useTranslations();
  const [searchQuery, setSearchQuery] = useSearchInputState(
    TOURNAMENTS_SEARCH,
    {
      mode: "client",
      debounceTime: 300,
      modifySearchParams: true,
    }
  );

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleSearchErase = () => {
    setSearchQuery("");
  };

  return (
    <div className="flex min-w-0 flex-1 justify-end sm:min-w-[unset] sm:flex-none">
      <ExpandableSearchInput
        value={searchQuery}
        onChange={handleSearchChange}
        onErase={handleSearchErase}
        placeholder={`${t("search")}...`}
        expandedWidthClassName="w-full sm:w-[176px]"
        buttonClassName="h-9 w-9 border-[1px] [&_svg]:text-blue-700 [&_svg]:dark:text-blue-700-dark border-blue-400 dark:border-blue-400-dark"
      />
    </div>
  );
};

export default TournamentsSearch;
