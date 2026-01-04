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
import cn from "@/utils/core/cn";
import { formatDate } from "@/utils/formatters/date";

import { getProxiedFaviconUrl } from "../../../utils";

type Props = {
  article: NewsArticle;
  isClosest?: boolean;
};

const NewsMatchArticle: FC<Props> = ({ article, isClosest }) => {
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
            {allowModifications && (
              <div className="mt-1 text-sm">
                <span>Similarity Distance:</span>
                <span
                  className={cn("mx-2", {
                    "font-bold text-red-700": isClosest,
                  })}
                >
                  {article.distance.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </a>
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
