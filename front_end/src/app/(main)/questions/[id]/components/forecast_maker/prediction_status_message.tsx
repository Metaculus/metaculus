import { isNil } from "lodash";
import { useTranslations } from "next-intl";
import { FC } from "react";

import { PostStatus, PostWithForecasts, QuestionStatus } from "@/types/post";

type Props = {
  post: PostWithForecasts;
};

const PredictionStatusMessage: FC<Props> = ({ post }) => {
  const t = useTranslations();

  switch (post.status) {
    case PostStatus.UPCOMING: {
      return <>{t("predictionUpcomingMessage")}</>;
    }
    case PostStatus.APPROVED: {
      if (Date.parse(post.open_time) > Date.now()) {
        return <>{t("predictionUpcomingMessage")}</>;
      }
      return null;
    }
    case PostStatus.REJECTED:
    case PostStatus.PENDING:
    case PostStatus.DRAFT: {
      return <>{t("predictionUnapprovedMessage")}</>;
    }
    case PostStatus.CLOSED: {
      if (!post.resolved) {
        if (post.conditional) {
          const questions = [
            post.conditional.condition,
            post.conditional.condition_child,
          ];
          const targetStatuses = [
            QuestionStatus.CLOSED,
            QuestionStatus.RESOLVED,
          ];

          const closedQuestion = questions.find(
            (obj) => !isNil(obj.status) && targetStatuses.includes(obj.status)
          );
          const activeQuestion = questions.find(
            (obj) => !isNil(obj.status) && !targetStatuses.includes(obj.status)
          );

          if (closedQuestion && activeQuestion) {
            return (
              <>
                {t("predictionConditionalPartiallyClosedMessage", {
                  closedQuestion: closedQuestion.title,
                  activeQuestion: activeQuestion.title,
                })}
              </>
            );
          }
        }

        return <>{t("predictionClosedMessage")}</>;
      }
    }
  }

  return null;
};

export default PredictionStatusMessage;
