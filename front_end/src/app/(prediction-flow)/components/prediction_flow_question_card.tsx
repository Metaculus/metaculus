import { useTranslations } from "next-intl";
import { FC } from "react";

import ConditionalTile from "@/components/conditional_tile";
import DetailedGroupCard from "@/components/detailed_question_card/detailed_group_card";
import DetailedQuestionCard from "@/components/detailed_question_card/detailed_question_card";
import Button from "@/components/ui/button";
import { useHideCP } from "@/contexts/cp_context";
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
  const t = useTranslations();
  if (hideCP) {
    return (
      <div className="text-center text-xs font-normal text-gray-700 dark:text-gray-700-dark sm:text-left sm:text-sm">
        <span>{t("cpHiddenByDefault")}</span>{" "}
        <Button
          variant="link"
          className="inline-block text-xs text-blue-700 dark:text-blue-700-dark sm:text-sm"
          onClick={() => setCurrentHideCP(false)}
        >
          {t("revealCP")}
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
