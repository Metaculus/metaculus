"use client";

import { useTranslations } from "next-intl";
import React from "react";

import SearchInput from "@/components/search_input";
import { POST_TEXT_SEARCH_FILTER } from "@/constants/posts_feed";
import useSearchInputState from "@/hooks/use_search_input_state";

const NewsFilters: React.FC = () => {
  const [search, setSearch] = useSearchInputState(POST_TEXT_SEARCH_FILTER);
  const eraseSearch = () => {
    setSearch("");
  };
  const t = useTranslations();

  return (
    <div>
      <SearchInput
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onErase={eraseSearch}
        placeholder={t("questionSearchPlaceholder")}
        className="mt-4"
      />
      <div className="mb-2 mt-4 flex flex-row justify-center gap-4">
        <span>All</span>
        <span>Program</span>
        <span>Research</span>
        <span>Platform</span>
      </div>
    </div>
  );
};

export default NewsFilters;
