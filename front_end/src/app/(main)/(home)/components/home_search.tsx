"use client";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { FC, useState } from "react";

import SearchInput from "@/components/search_input";
import { POST_TEXT_SEARCH_FILTER } from "@/constants/posts_feed";
import { encodeQueryParams } from "@/utils/navigation";

type Props = {};

const HomeSearch: FC<Props> = () => {
  const t = useTranslations();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchSubmit = (searchQuery: string) => {
    router.push(
      `/questions` +
        encodeQueryParams({ [POST_TEXT_SEARCH_FILTER]: searchQuery })
    );
  };

  return (
    <SearchInput
      value={searchQuery}
      onChange={(event) => setSearchQuery(event.target.value)}
      onErase={() => setSearchQuery("")}
      onSubmit={handleSearchSubmit}
      placeholder={t("forecastsSearchPlaceholder")}
      size="lg"
      className="md:max-w-xl"
    />
  );
};

export default HomeSearch;
