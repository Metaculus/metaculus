import { useTranslations } from "next-intl";
import React, { FC } from "react";

import { PostStatus } from "@/types/post";

type Props = {
  statuses?: string | string[];
};

const EmptyCommunityFeed: FC<Props> = ({ statuses }) => {
  const t = useTranslations();

  let message = "";
  switch (statuses) {
    case PostStatus.CLOSED:
      message = t("noClosedCommunityQuestions") + ".";
      break;
    case PostStatus.RESOLVED:
      message = t("noResolvedCommunityQuestions") + ".";
      break;
    case PostStatus.PENDING:
      message = "No questions in review yet.";
      message = t("noReviewCommunityQuestions") + ".";
      break;
    case PostStatus.OPEN:
    default:
      message = t("noOpenCommunityQuestions") + ".";
      break;
  }
  return (
    <span className="my-16 text-center text-base font-medium text-gray-600 dark:text-gray-600-dark">
      {message}
    </span>
  );
};

export default EmptyCommunityFeed;
