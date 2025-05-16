"use client";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC, useState } from "react";

import Button from "@/components/ui/button";
import SectionToggle from "@/components/ui/section_toggle";
import { NewsArticle } from "@/types/news";

import NewsMatchArticle from "./news_match_article";

interface Props {
  allowModifications?: boolean;
  articles: NewsArticle[];
}

const NewsMatchDrawer: FC<Props> = ({ articles }) => {
  const t = useTranslations();
  const [articleDisplayLimit, setArticleDisplayLimit] = useState(3);
  const closestArticle = [...articles].sort(
    (a, b) => a.distance - b.distance
  )?.[0];

  return (
    <div className="w-full @container">
      <SectionToggle defaultOpen title={t("newsMatch")} variant="light">
        <div className="pt-1">
          {articles
            .slice(0, articleDisplayLimit)
            .map((article: NewsArticle) => (
              <NewsMatchArticle
                key={article.id}
                article={article}
                isClosest={closestArticle?.id === article.id}
              />
            ))}
          <div className="flex flex-col items-center justify-between hover:text-blue-700 @md:flex-row">
            {articles.length > articleDisplayLimit && (
              <Button
                variant="tertiary"
                className="mb-4"
                onClick={() => setArticleDisplayLimit((prev) => prev + 5)}
              >
                {t("showMoreNews")}
              </Button>
            )}
            <div className="size-fit text-sm text-gray-900 dark:text-gray-900-dark">
              {t.rich("learnMoreAboutNewsMatch", {
                link: (chunks) => (
                  <Link
                    href="/faq/#related-news"
                    className="text-blue-700 dark:text-blue-700-dark"
                  >
                    {chunks}
                  </Link>
                ),
              })}
            </div>
          </div>
        </div>
      </SectionToggle>
    </div>
  );
};

export default NewsMatchDrawer;
