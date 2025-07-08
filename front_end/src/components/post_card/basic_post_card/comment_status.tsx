"use client";

import { faComment as faRegularComment } from "@fortawesome/free-regular-svg-icons";
import { faComment as faSolidComment } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC } from "react";

import Button from "@/components/ui/button";
import { useAuth } from "@/contexts/auth_context";
import cn from "@/utils/core/cn";
import { abbreviatedNumber } from "@/utils/formatters/number";

type Props = {
  url: string;
  unreadCount: number;
  totalCount: number;
};

const CommentStatus: FC<Props> = ({ unreadCount, totalCount, url }) => {
  const t = useTranslations();
  const { user } = useAuth();
  const unreadCountFormatted = abbreviatedNumber(
    unreadCount,
    2,
    false,
    undefined,
    3
  );
  const totalCountFormatted = abbreviatedNumber(
    totalCount,
    2,
    false,
    undefined,
    3
  );

  return (
    <Button
      variant="text"
      className={cn(
        "gap-2 rounded-xs border-none bg-gray-200 px-2.5 py-1 text-xs font-normal text-gray-700 dark:bg-gray-200-dark dark:text-gray-700-dark",
        {
          "text-gray-500 dark:text-gray-500-dark": !totalCount,
        }
      )}
      href={url + "#comments"}
    >
      {totalCount > 0 ? (
        <FontAwesomeIcon
          icon={faSolidComment}
          className={cn("text-blue-500 dark:text-blue-500-dark", {
            "text-purple-600 dark:text-purple-600-dark": unreadCount > 0,
          })}
        />
      ) : (
        <FontAwesomeIcon
          icon={faRegularComment}
          className={cn("text-gray-700  dark:text-gray-700-dark", {
            "text-gray-500 dark:text-gray-500-dark": !totalCount,
          })}
        />
      )}
      {/* Large screens version */}
      <span className="hidden align-middle md:block">
        {user && unreadCount > 0 ? (
          <span className="text-gray-500 dark:text-gray-500-dark">
            {t.rich("unreadWithTotalCount", {
              unread_count_formatted: unreadCountFormatted,
              total_count_formatted: totalCountFormatted,
              purple: (obj) => (
                <span className="text-purple-700 dark:text-purple-700-dark">
                  {obj}
                </span>
              ),
            })}
          </span>
        ) : (
          <span
            className={cn("text-gray-700  dark:text-gray-700-dark", {
              "text-gray-500 dark:text-gray-500-dark": !totalCount,
            })}
          >
            {t.rich("totalCommentsCount", {
              total_count: totalCount,
              total_count_formatted: totalCountFormatted,
            })}
          </span>
        )}
      </span>
      {/* Small screens version. */}
      <span className="block align-middle md:hidden">
        {user && unreadCount > 0 ? (
          <span className="text-gray-500 dark:text-gray-500-dark">
            {t.rich("unreadWithTotalCountXs", {
              unread_count_formatted: unreadCountFormatted,
              total_count_formatted: totalCountFormatted,
              purple: (obj) => (
                <span className="text-purple-700 dark:text-purple-700-dark">
                  {obj}
                </span>
              ),
            })}
          </span>
        ) : (
          <span
            className={cn("text-gray-700  dark:text-gray-700-dark", {
              "text-gray-500 dark:text-gray-500-dark": !totalCount,
            })}
          >
            {totalCountFormatted}
          </span>
        )}
      </span>
    </Button>
  );
};

export default CommentStatus;
