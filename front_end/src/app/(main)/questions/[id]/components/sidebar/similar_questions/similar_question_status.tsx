import { FC } from "react";

import PostStatus from "@/components/post_status";
import { PostWithForecasts } from "@/types/post";
import { extractPostStatus } from "@/utils/questions";

type Props = {
  question: PostWithForecasts;
};

const QuestionStatus: FC<Props> = ({ question }) => {
  const statusData = extractPostStatus(question);

  if (!!statusData) {
    return (
      <PostStatus
        id={question.id}
        status={statusData.status}
        actualCloseTime={statusData.actualCloseTime}
        resolvedAt={statusData.resolvedAt}
        post={question}
      />
    );
  }
};

export default QuestionStatus;
