"use client";

import { debounce } from "lodash";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import React, { useState, useEffect, useCallback } from "react";

import RandomButton from "@/components/random_button";
import SearchInput from "@/components/search_input";
import {
  POST_ORDER_BY_FILTER,
  POST_TEXT_SEARCH_FILTER,
} from "@/constants/posts_feed";
import { useGlobalSearchContext } from "@/contexts/global_search_context";
import { QuestionOrder } from "@/types/question";
import { sendAnalyticsEvent } from "@/utils/analytics";
import cn from "@/utils/core/cn";
import { encodeQueryParams } from "@/utils/navigation";

interface GlobalSearchProps {
  className?: string;
  isMobile?: boolean;
  onSubmit?: () => void;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({
  className,
  isMobile = false,
  onSubmit,
}) => {
  const t = useTranslations();
  const router = useRouter();
  const [isHidden, setIsHidden] = useState(true);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedAnalyticsEvent = useCallback(
    debounce(() => {
      sendAnalyticsEvent("feedSearch", {
        event_category: "fromNavbar",
      });
    }, 2000),
    []
  );

  const {
    globalSearch,
    updateGlobalSearch,
    isVisible: otherSearchIsVisible,
    isSearched,
    setIsSearched,
  } = useGlobalSearchContext();

  useEffect(() => {
    setIsHidden(otherSearchIsVisible);
  }, [otherSearchIsVisible]);

  const eraseSearch = () => {
    updateGlobalSearch("");
    setIsSearched(false);
  };

  const handleSearchSubmit = (searchQuery: string) => {
    debouncedAnalyticsEvent();
    onSubmit?.();
    setIsSearched(true);
    router.push(
      `/questions` +
        encodeQueryParams({
          [POST_TEXT_SEARCH_FILTER]: searchQuery,
          [POST_ORDER_BY_FILTER]: QuestionOrder.RankDesc,
        })
    );
  };

  const visibilityClass = isMobile
    ? "flex md:hidden"
    : isHidden
      ? "hidden"
      : "hidden md:flex";

  return (
    <div
      className={cn(
        "ml-2.5 items-center self-center xl:items-center",
        visibilityClass,
        className
      )}
    >
      <SearchInput
        value={globalSearch}
        onChange={(e) => updateGlobalSearch(e.target.value)}
        onErase={eraseSearch}
        onSubmit={handleSearchSubmit}
        placeholder={t("questionSearchPlaceholder")}
        size="base"
        className="w-full min-w-[220px]"
        inputClassName={cn(
          "text-white",
          "bg-blue-800 dark:bg-blue-800 hover:bg-blue-600 dark:hover:bg-blue-600 focus:bg-blue-900 dark:focus:bg-blue-900",
          "border border-blue-700 dark:border-blue-700 hover:border-blue-600 dark:hover:border-blue-600 focus:border-blue-600 dark:focus:border-blue-600",
          "outline-none focus:outline-1 focus:outline-offset-0 focus:outline-blue-600 dark:focus:outline-blue-600",
          "placeholder:text-blue-500 dark:placeholder:text-blue-500 focus:placeholder:text-blue-500/30 dark:focus:placeholder:text-blue-500/30",
          "outline-none focus:outline-none",
          { "bg-blue-700 dark:bg-blue-700": isSearched }
        )}
        eraseButtonClassName="text-white dark:text-white hover:text-white"
        submitButtonClassName="hidden md:block"
        submitIconClassName="text-blue-500 dark:text-blue-500"
      />
      <RandomButton />
    </div>
  );
};

export default GlobalSearch;
