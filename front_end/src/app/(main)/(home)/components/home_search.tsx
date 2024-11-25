"use client";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { FC, useState } from "react";

import SearchInput from "@/components/search_input";
import { POST_TEXT_SEARCH_FILTER } from "@/constants/posts_feed";
import { encodeQueryParams } from "@/utils/navigation";
import VisibilityObserver from "@/components/visibility_observer";
import { useGlobalSearchContext } from "@/contexts/global_search_context";
import { sendGAEvent } from "@next/third-parties/google";

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

    sendGAEvent({
      event: "feedSearch",
      event_category: "fromHomepage",
    });
  };

  const { setIsVisible } = useGlobalSearchContext();

  return (
    <VisibilityObserver
      onVisibilityChange={(v) => {
        setIsVisible(v);
      }}
    >
      <SearchInput
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.target.value)}
        onErase={() => setSearchQuery("")}
        onSubmit={handleSearchSubmit}
        placeholder={t("questionSearchPlaceholder")}
        size="lg"
        className="md:max-w-xl"
      />
    </VisibilityObserver>
  );
};

export default HomeSearch;
