"use client";

import { faNewspaper } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useLocale } from "next-intl";
import React from "react";

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
};

const KeyFactorNewsItem: React.FC<Props> = ({
  faviconUrl,
  source,
  title,
  createdAt,
  url,
  isCompact = false,
  isConsumer = false,
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
    <div>
      <a
        {...linkProps}
        className="float-right mb-1 ml-2.5 size-10 flex-shrink-0 no-underline"
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
        className={cn(
          "my-0 block font-medium text-gray-900 no-underline hover:underline dark:text-gray-900-dark",
          isCompact ? "text-xs" : "text-base leading-5"
        )}
      >
        {title}
      </a>

      <a
        {...linkProps}
        className={cn(
          "mt-1 flex max-w-full items-center gap-1.5 overflow-hidden text-ellipsis whitespace-nowrap font-medium no-underline",
          isCompact ? "text-[10px]" : "text-xs",
          isConsumer
            ? "text-blue-600 dark:text-blue-600-dark"
            : "text-gray-900 dark:text-gray-900-dark"
        )}
      >
        <span
          className={cn("truncate", isCompact ? "max-w-[8ch]" : "max-w-[12ch]")}
        >
          {source}
        </span>
        {date && (
          <>
            <span
              className={cn(
                isCompact
                  ? "text-blue-400 dark:text-blue-400-dark"
                  : "text-gray-500 dark:text-gray-500-dark"
              )}
            >
              •
            </span>
            <span suppressHydrationWarning className="text-nowrap">
              {formatDate(locale, date)}
            </span>
          </>
        )}
      </a>
    </div>
  );
};

export default KeyFactorNewsItem;
