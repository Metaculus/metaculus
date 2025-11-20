"use client";

import { faNewspaper } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useLocale } from "next-intl";

import ImageWithFallback from "@/components/ui/image_with_fallback";
import cn from "@/utils/core/cn";
import { formatDate } from "@/utils/formatters/date";

import { getProxiedFaviconUrl } from "../../../../utils";

type Props = {
  faviconUrl: string | null;
  source: string;
  title: string;
  createdAt: string;
  isCompact?: boolean;
  isConsumer?: boolean;
};

const KeyFactorNewsItem: React.FC<Props> = ({
  faviconUrl,
  source,
  title,
  createdAt,
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

  return (
    <div
      className={cn(
        "flex min-w-[130px] items-start gap-[14px]",
        isConsumer && "flex-col"
      )}
    >
      {faviconUrl ? (
        <ImageWithFallback
          className="size-[42px] rounded"
          src={getProxiedFaviconUrl(faviconUrl)}
          alt={`${source} logo`}
          aria-label={`${source} logo`}
        >
          <span className="flex size-[42px] items-center justify-center rounded bg-gray-200 dark:bg-gray-200-dark">
            <FontAwesomeIcon icon={faNewspaper} size="xl" />
          </span>
        </ImageWithFallback>
      ) : (
        <span className="flex size-[42px] items-center justify-center rounded bg-gray-200 dark:bg-gray-200-dark" />
      )}

      <div className="flex flex-1 flex-col gap-1.5">
        <h6
          className={cn(
            "my-0 font-medium text-blue-800 dark:text-blue-800-dark",
            isCompact ? "text-xs" : "text-sm"
          )}
        >
          {title}
        </h6>
        <div
          className={cn(
            "flex items-center gap-1.5 font-normal",
            isCompact ? "text-[10px]" : "text-xs",
            isConsumer
              ? "text-blue-600 dark:text-blue-600-dark"
              : "text-gray-600 dark:text-gray-600-dark"
          )}
        >
          <span className={cn(isCompact && "max-w-[8ch] truncate")}>
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
        </div>
      </div>
    </div>
  );
};

export default KeyFactorNewsItem;
