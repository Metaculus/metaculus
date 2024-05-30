import { faComment as faRegularComment } from "@fortawesome/free-regular-svg-icons";
import { faComment as faSolidComment } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC } from "react";

import Button from "@/components/ui/button";
import { abbreviatedNumber } from "@/utils/number_formatters";

type Props = {
  url: string;
  newCommentsCount: number;
};

const CommentStatus: FC<Props> = ({ newCommentsCount, url }) => {
  const t = useTranslations();
  const formattedCount = abbreviatedNumber(newCommentsCount, 2, 0);

  return (
    <Button
      variant="text"
      className="bg-gradient-to-b hover:from-metac-blue-300 hover:to-metac-blue-100 dark:hover:from-metac-blue-300-dark dark:hover:to-metac-blue-100-dark"
      href={url + "#comments"}
    >
      {newCommentsCount > 0 ? (
        <FontAwesomeIcon
          icon={faSolidComment}
          size="lg"
          className="text-metac-blue-500 dark:text-metac-blue-500-dark"
        />
      ) : (
        <FontAwesomeIcon
          icon={faRegularComment}
          size="lg"
          className="text-metac-gray-400"
        />
      )}
      {/* Large screens version */}
      <span className="hidden align-middle md:block">
        {`${newCommentsCount ? `${formattedCount} ` : ""}` +
          t("commentsWithCount", { count: formattedCount })}
      </span>
      {/* Small screens version */}
      <span className="block align-middle md:hidden">{formattedCount}</span>
    </Button>
  );
};

export default CommentStatus;
