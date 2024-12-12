"use client";

import { Tab, TabGroup, TabList } from "@headlessui/react";
import { sendGAEvent } from "@next/third-parties/google";
import classNames from "classnames";
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
import VisibilityObserver from "@/components/visibility_observer";
import { POST_NEWS_TYPE_FILTER } from "@/constants/posts_feed";
import { useGlobalSearchContext } from "@/contexts/global_search_context";
import useSearchParams from "@/hooks/use_search_params";
import { NewsCategory } from "@/types/projects";

type Props = {
  categories: NewsCategory[];
};

const NewsFilters: React.FC<Props> = ({ categories }) => {
  const { params, setParam, deleteParam } = useSearchParams();

  const { globalSearch, setGlobalSearch, setIsVisible } =
    useGlobalSearchContext();

  const eraseSearch = () => {
    setGlobalSearch("");
  };
  const categoryOptions = useMemo(
    () =>
      categories.map((obj) => ({
        label: obj.name,
        value: obj.slug,
      })),
    [categories]
  );

  const t = useTranslations();

  const debouncedGAEvent = useCallback(
    debounce(() => {
      sendGAEvent({
        event: "feedSearch",
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
  };

  return (
    <div>
      <VisibilityObserver
        onVisibilityChange={(v) => {
          setIsVisible(v);
        }}
      >
        <SearchInput
          value={globalSearch}
          onChange={(e) => {
            debouncedGAEvent();
            setGlobalSearch(e.target.value);
          }}
          onErase={eraseSearch}
          placeholder={t("articlesSearchPlaceholder")}
          className="mx-auto mb-6 max-w-2xl"
        />
      </VisibilityObserver>

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
