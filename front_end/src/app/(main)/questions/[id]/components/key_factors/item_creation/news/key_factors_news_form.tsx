"use client";

import { faChain } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { Dispatch, SetStateAction, useState } from "react";

import { Tabs, TabsList, TabsSection, TabsTab } from "@/components/ui/tabs";
import type { ImpactMetadata } from "@/types/comment";
import type { NewsArticle } from "@/types/news";
import type { PostWithForecasts } from "@/types/post";

import KeyFactorsPasteUrlTab from "./key_factors_paste_url_tab";
import KeyFactorsSuggestedNewsTab from "./key_factors_suggested_news_tab";

type Props = {
  post: PostWithForecasts;
  articles: NewsArticle[];
  selectedId: number | null;
  selectedImpact: ImpactMetadata;
  setSelectedImpact: Dispatch<SetStateAction<ImpactMetadata>>;
  setArticles: Dispatch<SetStateAction<NewsArticle[]>>;
  setSelectedId: Dispatch<SetStateAction<number | null>>;
};

const KeyFactorsNewsForm: React.FC<Props> = ({
  post,
  articles,
  selectedId,
  selectedImpact,
  setSelectedImpact,
  setArticles,
  setSelectedId,
}) => {
  const t = useTranslations();
  const [currentTab, setCurrentTab] = useState<"news_match" | "url">(
    "news_match"
  );
  const [pasteUrl, setPasteUrl] = useState("");
  const [pasteImpact, setPasteImpact] = useState<ImpactMetadata>({
    impact_direction: null,
    certainty: null,
  });

  const tabDefs = [
    {
      value: "news_match" as const,
      label:
        articles.length > 0
          ? t.rich("newsMatchCount", { count: articles.length })
          : t("newsMatch"),
    },
    {
      value: "url" as const,
      label: t("pasteUrl"),
      icon: <FontAwesomeIcon icon={faChain} />,
    },
  ];

  return (
    <Tabs
      defaultValue={currentTab}
      value={currentTab}
      onChange={(v) => setCurrentTab(v as "news_match" | "url")}
      className="bg-transparent dark:bg-transparent"
    >
      <TabsList className="static bg-transparent pb-0 antialiased dark:bg-transparent">
        {tabDefs.map((tab) => (
          <TabsTab
            key={tab.value}
            value={tab.value}
            scrollOnSelect={false}
            icon={tab?.icon}
            dynamicClassName={(isActive) =>
              `py-2 !text-sm font-medium h-8 !px-3 [&>span]:-mt-[1px] [&>span]:gap-2 leading-[16px] ${
                isActive
                  ? ""
                  : "text-blue-700 dark:text-blue-700-dark bg-gray-0 dark:bg-gray-0-dark border border-blue-400 dark:border-blue-400-dark"
              }`
            }
          >
            {tab.label}
          </TabsTab>
        ))}
      </TabsList>

      <TabsSection value="news_match">
        <KeyFactorsSuggestedNewsTab
          post={post}
          articles={articles}
          selectedId={selectedId}
          selectedImpact={selectedImpact}
          setSelectedImpact={setSelectedImpact}
          setSelectedId={setSelectedId}
          setArticles={setArticles}
        />
      </TabsSection>

      <TabsSection value="url">
        <KeyFactorsPasteUrlTab
          post={post}
          url={pasteUrl}
          setUrl={setPasteUrl}
          selectedImpact={pasteImpact}
          setSelectedImpact={setPasteImpact}
          showError={false}
        />
      </TabsSection>
    </Tabs>
  );
};

export default KeyFactorsNewsForm;
