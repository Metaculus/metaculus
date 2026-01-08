"use client";

import { faChain } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { Dispatch, SetStateAction, useState } from "react";

import { Tabs, TabsList, TabsSection, TabsTab } from "@/components/ui/tabs";
import type { ImpactMetadata } from "@/types/comment";
import type { NewsArticle } from "@/types/news";
import type { PostWithForecasts } from "@/types/post";
import cn from "@/utils/core/cn";

import KeyFactorsPasteUrlTab from "./key_factors_paste_url_tab";
import KeyFactorsSuggestedNewsTab from "./key_factors_suggested_news_tab";
import { Target } from "../driver/option_target_picker";

type Props = {
  post: PostWithForecasts;
  articles: NewsArticle[];
  selectedId: number | null;
  selectedImpact: ImpactMetadata;
  target: Target;
  setSelectedImpact: Dispatch<SetStateAction<ImpactMetadata>>;
  setArticles: Dispatch<SetStateAction<NewsArticle[]>>;
  setSelectedId: Dispatch<SetStateAction<number | null>>;
  onUrlPreviewLoaded?: (article: NewsArticle | null) => void;
  onTargetChange: Dispatch<SetStateAction<Target>>;
  className?: string;
  existingNewsUrls: string[];
};

const KeyFactorsNewsForm: React.FC<Props> = ({
  post,
  articles,
  selectedId,
  selectedImpact,
  target,
  setSelectedImpact,
  setArticles,
  setSelectedId,
  onUrlPreviewLoaded,
  onTargetChange,
  existingNewsUrls,
  className,
}) => {
  const t = useTranslations();
  const [currentTab, setCurrentTab] = useState<"news_match" | "url">(
    "news_match"
  );

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
      className={cn("bg-transparent dark:bg-transparent", className)}
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
          target={target}
          onTargetChange={onTargetChange}
          setSelectedImpact={setSelectedImpact}
          setSelectedId={setSelectedId}
          setArticles={setArticles}
          existingNewsUrls={existingNewsUrls}
        />
      </TabsSection>

      <TabsSection value="url">
        <KeyFactorsPasteUrlTab
          post={post}
          selectedImpact={selectedImpact}
          target={target}
          onTargetChange={onTargetChange}
          setSelectedImpact={setSelectedImpact}
          onPreviewLoaded={onUrlPreviewLoaded}
          existingNewsUrls={existingNewsUrls}
        />
      </TabsSection>
    </Tabs>
  );
};

export default KeyFactorsNewsForm;
