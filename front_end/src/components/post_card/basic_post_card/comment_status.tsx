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
  className?: string;
  compact?: boolean;
  variant?: "default" | "gray";
};

const CommentStatus: FC<Props> = ({
  unreadCount,
  totalCount,
  url,
  className,
  compact = false,
  variant = "default",
}) => {
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
        "border-nonepx-2 h-6 gap-1 text-nowrap rounded-xs border-none py-1 text-xs font-normal text-gray-700 dark:text-gray-700-dark md:gap-2 md:px-2.5",
        {
          "text-gray-500 dark:text-gray-500-dark": !totalCount,
        },
        className
      )}
      href={url + "#comments"}
    >
      {variant === "gray" ? (
        <FontAwesomeIcon
          icon={faSolidComment}
          className="text-gray-400 dark:text-gray-400-dark"
        />
      ) : (
        <>
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
        </>
      )}
      {/* Compact version - just shows numbers */}
      {compact && totalCount > 0 && (
        <span className="align-middle">
          {user && unreadCount > 0 ? (
            <span className="text-gray-500 dark:text-gray-500-dark">
              <span className="text-purple-700 dark:text-purple-700-dark">
                (
                <span className="font-medium tabular-nums">
                  {unreadCountFormatted}
                </span>
                )
              </span>{" "}
              <span className="font-medium tabular-nums">
                {totalCountFormatted}
              </span>
            </span>
          ) : (
            <span
              className={cn("text-gray-700  dark:text-gray-700-dark", {
                "text-gray-500 dark:text-gray-500-dark": !totalCount,
              })}
            >
              <span className="font-medium tabular-nums">
                {totalCountFormatted}
              </span>
            </span>
          )}
        </span>
      )}
      {/* Full version - shows descriptive text */}
      {!compact && (
        <span className="align-middle">
          {user && unreadCount > 0 ? (
            <span className="text-gray-500 dark:text-gray-500-dark">
              <span className="text-purple-700 dark:text-purple-700-dark">
                (
                <span className="font-medium tabular-nums">
                  {unreadCountFormatted}
                </span>{" "}
                unread)
              </span>{" "}
              <span className="font-medium tabular-nums">
                {totalCountFormatted}
              </span>{" "}
              total
            </span>
          ) : (
            <span
              className={cn("text-gray-700  dark:text-gray-700-dark", {
                "text-gray-500 dark:text-gray-500-dark": !totalCount,
                "text-gray-700 dark:text-gray-700-dark": variant === "gray",
              })}
            >
              <span className="font-medium tabular-nums">
                {totalCountFormatted}
              </span>{" "}
              {totalCount === 1 ? "comment" : "comments"}
            </span>
          )}
        </span>
      )}
    </Button>
  );
};

export default CommentStatus;
