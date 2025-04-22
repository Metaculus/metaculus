"use client";

import { Tab, TabGroup, TabList } from "@headlessui/react";
import { debounce } from "lodash";
import { useTranslations } from "next-intl";
import React, {
  FC,
  Fragment,
  PropsWithChildren,
  useCallback,
  useMemo,
} from "react";

import SearchInput from "@/components/search_input";
import {
  POST_NEWS_TYPE_FILTER,
  POST_PAGE_FILTER,
  POST_TEXT_SEARCH_FILTER,
} from "@/constants/posts_feed";
import { useAuth } from "@/contexts/auth_context";
import useSearchInputState from "@/hooks/use_search_input_state";
import useSearchParams from "@/hooks/use_search_params";
import { NewsCategory } from "@/types/projects";
import { sendAnalyticsEvent } from "@/utils/analytics";
import cn from "@/utils/cn";

import NewsSubscribeButton from "./news_subscribe_button";

type Props = {
  categories: NewsCategory[];
};

const NewsFilters: React.FC<Props> = ({ categories }) => {
  const { params, setParam, deleteParam } = useSearchParams();
  const { user } = useAuth();

  const [search, setSearch] = useSearchInputState(POST_TEXT_SEARCH_FILTER, {
    mode: "server",
    debounceTime: 300,
    modifySearchParams: true,
  });
  const eraseSearch = () => {
    setSearch("");
  };
  const categoryOptions = useMemo(
    () =>
      categories.map((obj) => ({
        label: obj.name.replace(/\snews$/i, ""),
        value: obj.slug,
      })),
    [categories]
  );

  const t = useTranslations();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedAnalyticsEvent = useCallback(
    debounce(() => {
      sendAnalyticsEvent("feedSearch", {
        event_category: "fromNews",
      });
    }, 2000),
    []
  );

  const postFilterParam = params.get(POST_NEWS_TYPE_FILTER);
  const selectedIndex = postFilterParam
    ? categoryOptions.findIndex((filter) => filter.value === postFilterParam) +
      1
    : 0;
  const handleTabChange = (index: number) => {
    if (index) {
      const filter = categoryOptions.at(index - 1);
      if (filter) {
        setParam(POST_NEWS_TYPE_FILTER, filter.value);
      }
    } else {
      deleteParam(POST_NEWS_TYPE_FILTER);
    }
    deleteParam(POST_PAGE_FILTER);
  };

  return (
    <div>
      <div className="mx-auto mb-6 flex max-w-2xl flex-row gap-3">
        <SearchInput
          value={search}
          onChange={(e) => {
            debouncedAnalyticsEvent();
            setSearch(e.target.value);
          }}
          onErase={eraseSearch}
          placeholder={t("articlesSearchPlaceholder")}
        />
        <div className="hidden lg:block">
          <NewsSubscribeButton categories={categories} user={user} />
        </div>
        <div className="lg:hidden">
          <NewsSubscribeButton categories={categories} user={user} mini />
        </div>
      </div>

      <TabGroup selectedIndex={selectedIndex} manual onChange={handleTabChange}>
        <TabList className="mb-6 flex flex-wrap justify-center gap-x-3 gap-y-1 font-serif text-base text-blue-700 dark:text-blue-700-dark">
          <FilterTab>All</FilterTab>
          {categoryOptions.map((filter) => (
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
        className={cn(
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
