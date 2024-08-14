"use client";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC, useState } from "react";

import Button from "@/components/ui/button";
import SectionToggle from "@/components/ui/section_toggle";
import { NewsArticle } from "@/types/news";

import NewsMatchArticle from "./news_match_article";

interface Props {
  questionId: number;
  allowModifications?: boolean;
  articles: NewsArticle[];
}

const NewsMatchDrawer: FC<Props> = ({ questionId, articles }) => {
  const t = useTranslations();
  const [articleDisplayLimit, setArticleDisplayLimit] = useState(3);

  return (
    <div className="w-full @container">
      <SectionToggle defaultOpen title={t("NewsMatch")}>
        {articles.slice(0, articleDisplayLimit).map((article: NewsArticle) => (
          <NewsMatchArticle
            key={article.id}
            article={article}
            questionId={questionId}
          />
        ))}
        <div className="flex flex-col items-center justify-between @md:flex-row">
          {articles.length > articleDisplayLimit ? (
            <Button
              variant="tertiary"
              className="mb-4"
              onClick={() => setArticleDisplayLimit((prev) => prev + 5)}
            >
              {t("showMoreNews")}
            </Button>
          ) : (
            <div />
          )}
          <div className="my-auto size-fit pr-2 text-sm leading-4 text-gray-900 dark:text-gray-900-dark">
            {t.rich("learnMoreAboutNewsMatch", {
              link: (chunks) => (
                <Link
                  href="/help/faq/#related-news"
                  className="text-blue-700 dark:text-blue-700-dark"
                >
                  {chunks}
                </Link>
              ),
            })}
          </div>
        </div>
      </SectionToggle>
    </div>
  );
};

export default NewsMatchDrawer;
