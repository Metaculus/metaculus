import { faPercent, faShare } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { capitalize } from "lodash";
import { useTranslations } from "next-intl";

import { SharePostMenu } from "@/components/post_actions";
import Button from "@/components/ui/button";
import { PostWithForecasts, QuestionStatus } from "@/types/post";
import {
  getPostTitle,
  isGroupOfQuestionsPost,
  isQuestionPost,
} from "@/utils/questions/helpers";

type Props = {
  postData: PostWithForecasts;
};

const QuestionActionButton: React.FC<Props> = ({ postData }) => {
  const t = useTranslations();
  return (
    <div className="mx-auto flex items-center justify-center gap-2 pb-5">
      <SharePostMenu
        questionId={postData.id}
        questionTitle={getPostTitle(postData)}
        textAlign="left"
      >
        <Button variant="tertiary">
          <FontAwesomeIcon icon={faShare} />
          {capitalize(t("share"))}
        </Button>
      </SharePostMenu>
      {((isQuestionPost(postData) &&
        postData.question.status === QuestionStatus.OPEN) ||
        (isGroupOfQuestionsPost(postData) &&
          postData.group_of_questions.questions.every(
            (q) => q.status === QuestionStatus.OPEN
          ))) && (
        <Button variant="tertiary">
          <FontAwesomeIcon icon={faPercent} />
          {t("predict")}
        </Button>
      )}
    </div>
  );
};

export default QuestionActionButton;
