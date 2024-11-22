"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import SearchInput from "@/components/search_input";
import { POST_TEXT_SEARCH_FILTER } from "@/constants/posts_feed";
import { encodeQueryParams } from "@/utils/navigation";
import { useGlobalSearchContext } from "@/contexts/global_search_context";

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
