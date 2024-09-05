"use client";

import { faComment as faRegularComment } from "@fortawesome/free-regular-svg-icons";
import { faComment as faSolidComment } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import classNames from "classnames";
import { useTranslations } from "next-intl";
import { FC } from "react";

import Button from "@/components/ui/button";
import { abbreviatedNumber } from "@/utils/number_formatters";
import { useAuth } from "@/contexts/auth_context";

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
  const formattedCount = abbreviatedNumber(newCommentsCount, 2, 0);

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
          className={classNames(
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
