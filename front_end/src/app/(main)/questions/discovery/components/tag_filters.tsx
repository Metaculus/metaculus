"use client";

import { useTranslations } from "next-intl";
import { FC } from "react";

import { TAGS_TEXT_SEARCH_FILTER } from "@/app/(main)/questions/discovery/constants/tags_feed";
import SearchInput from "@/components/search_input";
import useSearchInputState from "@/hooks/use_search_input_state";

const TagFilters: FC = () => {
  const t = useTranslations();

  const [searchQuery, setSearchQuery] = useSearchInputState(
    TAGS_TEXT_SEARCH_FILTER,
    { modifySearchParams: true }
  );

  return (
    <SearchInput
      value={searchQuery}
      onChange={(event) => setSearchQuery(event.target.value)}
      onErase={() => setSearchQuery("")}
      placeholder={t("tagSearchPlaceholder")}
      className="max-w-lg"
    />
  );
};

export default TagFilters;
