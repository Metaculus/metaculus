"use client";

import { faNewspaper } from "@fortawesome/free-regular-svg-icons";
import { faArrowUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useLocale } from "next-intl";
import React, { useLayoutEffect, useRef, useState } from "react";

import ImageWithFallback from "@/components/ui/image_with_fallback";
import cn from "@/utils/core/cn";
import { formatDate } from "@/utils/formatters/date";

import { getProxiedFaviconUrl } from "../../../../utils";

type Props = {
  faviconUrl: string | null;
  source: string;
  title: string;
  createdAt: string;
  url: string;
  isCompact?: boolean;
  isConsumer?: boolean;
  titleLinksToArticle?: boolean;
  truncate?: boolean;
};

const KeyFactorNewsItem: React.FC<Props> = ({
  faviconUrl,
  source,
  title,
  createdAt,
  url,
  isCompact = false,
  titleLinksToArticle = true,
  truncate = false,
}) => {
  const locale = useLocale();

  let date: Date | null = null;
  if (createdAt) {
    const d = new Date(createdAt);
    if (!Number.isNaN(d.getTime())) {
      date = d;
    }
  }

  const handleLinkClick: React.MouseEventHandler<HTMLAnchorElement> = (e) => {
    e.stopPropagation();
  };

  const linkProps = {
    href: url,
    target: "_blank",
    rel: "noopener noreferrer",
    onClick: handleLinkClick,
  };

  return (
    <div className="flex gap-2.5">
      <div className="flex min-w-0 flex-1 flex-col">
        {titleLinksToArticle ? (
          <a
            {...linkProps}
            className={cn(
              "my-0 block break-words font-medium text-gray-900 no-underline hover:underline dark:text-gray-900-dark",
              isCompact
                ? "line-clamp-4 text-xs leading-4"
                : cn("text-sm leading-5", truncate && "line-clamp-5")
            )}
          >
            {title}
          </a>
        ) : (
          <span
            className={cn(
              "my-0 block break-words font-medium text-gray-900 dark:text-gray-900-dark",
              isCompact
                ? "line-clamp-4 text-xs leading-4"
                : cn("text-sm leading-5", truncate && "line-clamp-5")
            )}
          >
            {title}
          </span>
        )}

        <a
          {...linkProps}
          className={cn(
            "relative mt-1 flex items-center gap-1.5 font-medium no-underline",
            isCompact ? "text-[10px]" : "text-xs",
            "text-blue-600 dark:text-blue-600-dark"
          )}
        >
          <SourceDateLabel
            source={source}
            date={date}
            locale={locale}
            isCompact={isCompact}
          />
        </a>
      </div>

      <div className="flex flex-shrink-0 flex-col items-center gap-1">
        <a
          {...linkProps}
          className="size-10 no-underline"
          aria-label={source ? `Open article on ${source}` : "Open article"}
        >
          {faviconUrl ? (
            <ImageWithFallback
              className="size-10 cursor-pointer rounded"
              src={getProxiedFaviconUrl(faviconUrl)}
              alt={`${source} logo`}
            >
              <span className="flex size-10 items-center justify-center rounded bg-gray-200 dark:bg-gray-200-dark">
                <FontAwesomeIcon icon={faNewspaper} size="xl" />
              </span>
            </ImageWithFallback>
          ) : (
            <span className="flex size-10 cursor-pointer items-center justify-center rounded bg-gray-200 dark:bg-gray-200-dark" />
          )}
        </a>
        <a
          {...linkProps}
          className="text-sm text-blue-700 no-underline hover:text-blue-800 dark:text-blue-700-dark dark:hover:text-blue-800-dark"
          aria-label="Open article in new tab"
        >
          <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
        </a>
      </div>
    </div>
  );
};

const SourceDateLabel: React.FC<{
  source: string;
  date: Date | null;
  locale: string;
  isCompact?: boolean;
}> = ({ source, date, locale, isCompact }) => {
  const measureRef = useRef<HTMLSpanElement>(null);
  const [hideSource, setHideSource] = useState(false);

  useLayoutEffect(() => {
    const el = measureRef.current;
    if (!el || !date) return;
    setHideSource(el.scrollWidth > el.clientWidth);
  }, [source, date]);

  if (!date) {
    return <span className="truncate">{source}</span>;
  }

  const dateStr = formatDate(locale, date);

  return (
    <>
      <span
        ref={measureRef}
        aria-hidden
        className="pointer-events-none invisible absolute inset-x-0 flex items-center gap-1.5 overflow-hidden whitespace-nowrap"
      >
        {source} • {dateStr}
      </span>
      {!hideSource && (
        <>
          <span className="flex-shrink-0 whitespace-nowrap">{source}</span>
          <span
            className={cn(
              "flex-shrink-0",
              isCompact
                ? "text-blue-400 dark:text-blue-400-dark"
                : "text-gray-500 dark:text-gray-500-dark"
            )}
          >
            •
          </span>
        </>
      )}
      <span suppressHydrationWarning className="flex-shrink-0 text-nowrap">
        {dateStr}
      </span>
    </>
  );
};

export default KeyFactorNewsItem;
