import { FC } from "react";

import ConditionalTile from "@/components/conditional_tile";
import DetailedGroupCard from "@/components/detailed_question_card/detailed_group_card";
import DetailedQuestionCard from "@/components/detailed_question_card/detailed_question_card";
import { useHideCP } from "@/components/question/cp_provider";
import Button from "@/components/ui/button";
import { PostWithForecasts } from "@/types/post";
import {
  isConditionalPost,
  isGroupOfQuestionsPost,
  isQuestionPost,
} from "@/utils/questions/helpers";

type Props = {
  post: PostWithForecasts;
};

const PredictionFlowQuestionCard: FC<Props> = ({ post }) => {
  const { hideCP, setCurrentHideCP } = useHideCP();

  if (hideCP) {
    return (
      <div className="text-center text-xs font-normal text-gray-700 dark:text-gray-700-dark sm:text-left sm:text-sm">
        <span>Community prediction is hidden by default in this flow. </span>
        <Button
          variant="link"
          className="inline-block text-xs text-blue-700 dark:text-blue-700-dark sm:text-sm"
          onClick={() => setCurrentHideCP(false)}
        >
          Reveal CP
        </Button>
      </div>
    );
  }

  return (
    <>
      {isConditionalPost(post) && (
        <ConditionalTile post={post} withNavigation withCPRevealBtn />
      )}

      {isQuestionPost(post) && <DetailedQuestionCard post={post} />}
      {isGroupOfQuestionsPost(post) && <DetailedGroupCard post={post} />}
    </>
  );
};

export default PredictionFlowQuestionCard;
