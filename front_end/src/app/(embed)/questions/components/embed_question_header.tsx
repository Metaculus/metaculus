import QuestionHeaderCPStatus from "@/app/(main)/questions/[id]/components/question_view/forecaster_question_view/question_header/question_header_cp_status";
import { PostWithForecasts } from "@/types/post";
import { QuestionWithForecasts } from "@/types/question";
import {
  isContinuousQuestion,
  isQuestionPost,
} from "@/utils/questions/helpers";

import TruncatableQuestionTitle from "./truncatable_question_title";

type Props = {
  post: PostWithForecasts;
};

const EmbedQuestionHeader: React.FC<Props> = ({ post }) => {
  return (
    <div className="flex items-center">
      <TruncatableQuestionTitle
        className="!text-[20px] !leading-[125%]"
        maxLines={4}
        revealOnHoverOrTap={true}
      >
        {post.title}
      </TruncatableQuestionTitle>
      {isQuestionPost(post) && (
        <QuestionHeaderCPStatus
          question={post.question as QuestionWithForecasts}
          size="md"
          hideLabel={isContinuousQuestion(post.question)}
        />
      )}
    </div>
  );
};

export default EmbedQuestionHeader;
