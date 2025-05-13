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
  newCommentsCount: number;
  commentColor?: "blue" | "purple";
};

const CommentStatus: FC<Props> = ({
  newCommentsCount,
  url,
  commentColor = "blue",
}) => {
  const t = useTranslations();
  const { user } = useAuth();
  const formattedCount = abbreviatedNumber(newCommentsCount, 2, false);

  return (
    <Button
      variant="text"
      className="bg-gradient-to-b hover:from-blue-300 hover:to-blue-100 dark:hover:from-blue-300-dark dark:hover:to-blue-100-dark"
      href={url + "#comments"}
    >
      {newCommentsCount > 0 ? (
        <FontAwesomeIcon
          icon={faSolidComment}
          size="lg"
          className={cn(
            {
              blue: "text-blue-500 dark:text-blue-500-dark",
              purple: "text-purple-500 dark:text-purple-500",
            }[commentColor]
          )}
        />
      ) : (
        <FontAwesomeIcon
          icon={faRegularComment}
          size="lg"
          className="text-gray-400"
        />
      )}
      {/* Large screens version */}
      <span className="hidden align-middle md:block">
        {`${newCommentsCount ? `${formattedCount} ` : ""}` +
          t(user ? "unreadWithCount" : "commentsWithCount", {
            count: formattedCount,
          })}
      </span>
      {/* Small screens version */}
      <span className="block align-middle md:hidden">{formattedCount}</span>
    </Button>
  );
};

export default CommentStatus;
