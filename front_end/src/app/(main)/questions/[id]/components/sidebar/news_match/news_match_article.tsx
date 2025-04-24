"use client";
import {
  faNewspaper,
  faXmarkCircle,
} from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useLocale, useTranslations } from "next-intl";
import { FC, useState } from "react";

import { removeRelatedArticle } from "@/app/(main)/questions/actions";
import Button from "@/components/ui/button";
import ImageWithFallback from "@/components/ui/image_with_fallback";
import { useAuth } from "@/contexts/auth_context";
import { NewsArticle } from "@/types/news";
import { formatDate } from "@/utils/formatters/date";

type Props = {
  article: NewsArticle;
  questionId: number;
};

function getProxiedFaviconUrl(originalUrl: string): string {
  if (!originalUrl) return "";
  return `/newsmatch/favicon?url=${encodeURIComponent(originalUrl)}`;
}

const NewsMatchArticle: FC<Props> = ({ article }) => {
  const { user } = useAuth();
  const locale = useLocale();
  const t = useTranslations();
  const allowModifications = user?.is_staff;

  const [articleRemoved, setArticleRemoved] = useState(false);

  async function blacklistArticle() {
    await removeRelatedArticle(article.id);
    setArticleRemoved(true);
  }

  if (articleRemoved) {
    return (
      <div className="mb-4 rounded bg-gray-200 py-4 text-center font-sans text-base dark:bg-gray-200-dark">
        <div>
          <span className="text-gray-700 dark:text-gray-700-dark">
            {t("removed") + ": "}
          </span>
          <strong>{article.media_label}</strong>
        </div>
        <span className="italic text-gray-700 dark:text-gray-700-dark">
          {article.title}
        </span>
      </div>
    );
  }

  return (
    <div className="mb-4 flex w-full flex-col @md:flex-row">
      <div className="flex flex-1">
        <a
          className="flex flex-1 items-start no-underline @md:order-2 @md:items-center"
          href={article.url}
        >
          {article.favicon_url ? (
            <ImageWithFallback
              className="mr-3 size-8 rounded-full"
              src={getProxiedFaviconUrl(article.favicon_url)}
              alt={`${article.media_label} logo`}
              aria-label={`${article.media_label} logo`}
            >
              <span className="mr-3 flex size-8 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-200-dark">
                <FontAwesomeIcon icon={faNewspaper} size="xl" />
              </span>
            </ImageWithFallback>
          ) : (
            <span className="mr-3 flex size-8 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-200-dark">
              <FontAwesomeIcon icon={faNewspaper} size="xl" />
            </span>
          )}
          <div className="flex-1 no-underline">
            <div className="text-base font-medium text-gray-900 dark:text-gray-900-dark">
              {article.title}
            </div>
            <div className="mt-1 text-sm text-gray-700 dark:text-gray-700-dark">
              <span>{article.media_label}</span>
              <span className="mx-2">•</span>
              <span suppressHydrationWarning>
                {formatDate(locale, new Date(article.created_at))}
              </span>
            </div>
          </div>
        </a>
        {/*
        {user && (
          <div className="mr-1 flex flex-col text-gray-900 @md:order-1 @md:self-center dark:text-gray-900-dark">
            <NewsArticleVoteButtons questionId={questionId} article={article} />
          </div>
        )}*/}
      </div>

      {allowModifications && (
        <Button
          variant="text"
          className="ml-8 self-start @md:ml-2"
          onClick={blacklistArticle}
        >
          <FontAwesomeIcon icon={faXmarkCircle} />
          {t("remove")}
        </Button>
      )}
    </div>
  );
};

export default NewsMatchArticle;
