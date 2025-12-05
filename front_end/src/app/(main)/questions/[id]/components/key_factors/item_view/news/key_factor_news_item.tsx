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
    <div
      className={cn(
        "flex min-w-[130px] items-start gap-[14px]",
        isConsumer && "flex-col"
      )}
    >
      <a
        {...linkProps}
        className="flex-shrink-0 no-underline"
        aria-label={source ? `Open article on ${source}` : "Open article"}
      >
        {faviconUrl ? (
          <ImageWithFallback
            className="size-[42px] cursor-pointer rounded"
            src={getProxiedFaviconUrl(faviconUrl)}
            alt={`${source} logo`}
          >
            <span className="flex size-[42px] items-center justify-center rounded bg-gray-200 dark:bg-gray-200-dark">
              <FontAwesomeIcon icon={faNewspaper} size="xl" />
            </span>
          </ImageWithFallback>
        ) : (
          <span className="flex size-[42px] cursor-pointer items-center justify-center rounded bg-gray-200 dark:bg-gray-200-dark" />
        )}
      </a>

      <div className="flex max-w-full flex-1 flex-col gap-1.5">
        <a
          {...linkProps}
          className={cn(
            "my-0 font-medium text-blue-800 no-underline hover:underline dark:text-blue-800-dark",
            isCompact ? "text-xs" : "text-sm"
          )}
        >
          {title}
        </a>

        <a
          {...linkProps}
          className={cn(
            "flex max-w-full items-center gap-1.5 overflow-hidden text-ellipsis whitespace-nowrap font-normal no-underline",
            isCompact ? "text-[10px]" : "text-xs",
            isConsumer
              ? "text-blue-600 dark:text-blue-600-dark"
              : "text-gray-600 dark:text-gray-600-dark"
          )}
        >
          <span
            className={cn(
              "truncate",
              isCompact ? "max-w-[8ch]" : "max-w-[12ch]"
            )}
          >
            {source}
          </span>
          {date && (
            <>
              <span
                className={cn(
                  isCompact
                    ? "text-blue-400 dark:text-blue-400-dark"
                    : "text-gray-400 dark:text-gray-400-dark"
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
    </div>
  );
};

export default KeyFactorNewsItem;
