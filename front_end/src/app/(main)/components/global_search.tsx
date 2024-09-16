"use client";
import React, { useState, RefObject, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import SearchInput from "@/components/search_input";
import { POST_TEXT_SEARCH_FILTER } from "@/constants/posts_feed";
import { encodeQueryParams } from "@/utils/navigation";

interface GlobalSearchProps {
  globalSearch?: boolean;
  inputRef?: RefObject<HTMLInputElement>;
  onSubmit?: () => void;
  className?: string;
  isMobile?: boolean;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({
  globalSearch,
  inputRef,
  onSubmit,
  className,
  isMobile = false,
}) => {
  const t = useTranslations();
  const router = useRouter();
  const [isHidden, setIsHidden] = useState(true); // Start hidden
  const [isLoading, setIsLoading] = useState(true); // Add loading state

  useEffect(() => {
    if (isMobile) {
      setIsHidden(false);
      setIsLoading(false);
      return;
    }

    const checkVisibility = () => {
      const isExistingSearchVisible =
        document.body.getAttribute("data-existing-search-visible") === "true";
      setIsHidden(isExistingSearchVisible);
      setIsLoading(false); // Set loading to false after checking visibility
    };

    // Delay the initial check to allow for DOM rendering
    const initialCheckTimeout = setTimeout(() => {
      checkVisibility();
    }, 100); // Adjust this delay as needed

    const observer = new MutationObserver(checkVisibility);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["data-existing-search-visible"],
    });

    return () => {
      observer.disconnect();
      clearTimeout(initialCheckTimeout);
    };
  }, [isMobile]);

  const handleSearchSubmit = useCallback(
    (query: string) => {
      router.push(
        `/questions` + encodeQueryParams({ [POST_TEXT_SEARCH_FILTER]: query })
      );
      onSubmit?.();
    },
    [router, onSubmit]
  );

  const visibilityClass = isMobile
    ? "flex xl:hidden"
    : isHidden || isLoading
      ? "hidden"
      : "hidden xl:flex";

  return (
    <div
      className={`self-center xl:ml-4 xl:items-center ${visibilityClass} ${className}`}
    >
      <SearchInput
        onChange={() => {}} // This is now handled internally in SearchInput
        onErase={() => {}} // This is now handled internally in SearchInput
        onSubmit={handleSearchSubmit}
        placeholder={t("questionSearchPlaceholder")}
        size="base"
        className="w-full"
        globalSearch={true}
        inputRef={inputRef}
      />
    </div>
  );
};

export default GlobalSearch;
