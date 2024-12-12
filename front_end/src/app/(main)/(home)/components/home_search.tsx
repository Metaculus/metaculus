"use client";
import { sendGAEvent } from "@next/third-parties/google";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { FC, useState } from "react";

import RandomButton from "@/components/random_button";
import SearchInput from "@/components/search_input";
import VisibilityObserver from "@/components/visibility_observer";
import {
  POST_ORDER_BY_FILTER,
  POST_TEXT_SEARCH_FILTER,
} from "@/constants/posts_feed";
import { useGlobalSearchContext } from "@/contexts/global_search_context";
import { QuestionOrder } from "@/types/question";
import { encodeQueryParams } from "@/utils/navigation";

type Props = {};

const HomeSearch: FC<Props> = () => {
  const t = useTranslations();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchSubmit = (searchQuery: string) => {
    router.push(
      `/questions` +
        encodeQueryParams({
          [POST_TEXT_SEARCH_FILTER]: searchQuery,
          [POST_ORDER_BY_FILTER]: QuestionOrder.RankDesc,
        })
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
      <div className="flex items-center gap-3">
        <SearchInput
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          onErase={() => setSearchQuery("")}
          onSubmit={handleSearchSubmit}
          placeholder={t("questionSearchPlaceholder")}
          size="lg"
          className="md:max-w-xl"
        />
        <RandomButton />
      </div>
    </VisibilityObserver>
  );
};

export default HomeSearch;
