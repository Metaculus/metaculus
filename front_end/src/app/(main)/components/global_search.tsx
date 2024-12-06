"use client";

import { sendGAEvent } from "@next/third-parties/google";
import { debounce } from "lodash";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import React, { useState, useEffect, useCallback } from "react";

import SearchInput from "@/components/search_input";
import { POST_TEXT_SEARCH_FILTER } from "@/constants/posts_feed";
import { useGlobalSearchContext } from "@/contexts/global_search_context";
import useDebounce from "@/hooks/use_debounce";
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

  const debouncedGAEvent = useCallback(
    debounce(() => {
      sendGAEvent({
        event: "feedSearch",
        event_category: "fromNavbar",
      });
    }, 2000),
    []
  );

  const {
    globalSearch,
    setGlobalSearch,
    isVisible: otherSearchIsVisible,
  } = useGlobalSearchContext();

  useEffect(() => {
    setIsHidden(otherSearchIsVisible);
  }, [otherSearchIsVisible]);

  const eraseSearch = () => {
    setGlobalSearch("");
  };

  const handleSearchSubmit = (searchQuery: string) => {
    debouncedGAEvent();
    onSubmit?.();
    router.push(
      `/questions` +
        encodeQueryParams({ [POST_TEXT_SEARCH_FILTER]: searchQuery })
    );
  };

  const visibilityClass = isMobile
    ? "flex xl:hidden"
    : isHidden
      ? "hidden"
      : "hidden xl:flex";

  return (
    <div
      className={`self-center xl:ml-4 xl:items-center ${visibilityClass} ${className}`}
    >
      <SearchInput
        value={globalSearch}
        onChange={(e) => setGlobalSearch(e.target.value)}
        onErase={eraseSearch}
        onSubmit={handleSearchSubmit}
        placeholder={t("questionSearchPlaceholder")}
        size="base"
        className="w-full"
        globalSearch={true}
      />
    </div>
  );
};

export default GlobalSearch;
