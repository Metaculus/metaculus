"use client";

import { Tab, TabGroup, TabList } from "@headlessui/react";
import classNames from "classnames";
import { useTranslations } from "next-intl";
import React, { FC, Fragment, PropsWithChildren } from "react";

import { getArticleTypeFilters } from "@/app/(main)/news/helpers/filters";
import SearchInput from "@/components/search_input";
import {
  POST_NEWS_TYPE_FILTER,
  POST_TEXT_SEARCH_FILTER,
} from "@/constants/posts_feed";
import useSearchInputState from "@/hooks/use_search_input_state";
import useSearchParams from "@/hooks/use_search_params";

const FILTERS = getArticleTypeFilters();

const NewsFilters: React.FC = () => {
  const { params, setParam, deleteParam } = useSearchParams();

  const [search, setSearch] = useSearchInputState(POST_TEXT_SEARCH_FILTER);
  const eraseSearch = () => {
    setSearch("");
  };
  const t = useTranslations();

  const postFilterParam = params.get(POST_NEWS_TYPE_FILTER);
  const selectedIndex = postFilterParam
    ? FILTERS.findIndex((filter) => filter.value === postFilterParam) + 1
    : 0;
  const handleTabChange = (index: number) => {
    if (index) {
      const filter = FILTERS.at(index - 1);
      if (filter) {
        setParam(POST_NEWS_TYPE_FILTER, filter.value);
      }
    } else {
      deleteParam(POST_NEWS_TYPE_FILTER);
    }
  };

  return (
    <div>
      <SearchInput
        onChange={(e) => setSearch(e.target.value)}
        onErase={eraseSearch}
        placeholder={t("articlesSearchPlaceholder")}
        className="mx-auto mb-6 max-w-2xl"
      />
      <TabGroup selectedIndex={selectedIndex} manual onChange={handleTabChange}>
        <TabList className="mb-6 flex flex-wrap justify-center gap-x-3 gap-y-1 font-serif text-base text-blue-700 dark:text-blue-700-dark">
          <FilterTab>All</FilterTab>
          {FILTERS.map((filter) => (
            <FilterTab key={filter.value}>{filter.label}</FilterTab>
          ))}
        </TabList>
      </TabGroup>
    </div>
  );
};

const FilterTab: FC<PropsWithChildren> = ({ children }) => (
  <Tab as={Fragment}>
    {({ selected }) => (
      <button
        className={classNames(
          "border-b p-2",
          selected
            ? "border-b-blue-900 text-blue-900 focus:outline-none dark:border-b-blue-900-dark dark:text-blue-900-dark"
            : "border-b-transparent"
        )}
      >
        {children}
      </button>
    )}
  </Tab>
);

export default NewsFilters;
