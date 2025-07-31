import { useTranslations } from "next-intl";

import PredictionBinaryInfo from "@/components/post_card/question_tile/prediction_binary_info";
import { QuestionStatus } from "@/types/post";
import { QuestionWithNumericForecasts } from "@/types/question";
import { QuestionResolutionChipFacade } from "@/components/consumer_post_card/question_resolution_chip";
import BinaryCPBar from "@/components/consumer_post_card/binary_cp_bar";
import { capitalize } from "lodash";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import cn from "@/utils/core/cn";

type Props = {
  question: QuestionWithNumericForecasts;
  canPredict: boolean;
};

const BinaryQuestionPrediction: React.FC<Props> = ({
  question,
  canPredict,
}) => {
  return (
    <div className="mx-auto space-y-7 px-10 py-5">
      <PredictionBinaryInfo
        showMyPrediction={true}
        question={question}
        canPredict={canPredict}
        size="lg"
        cpMovementVariant="chip"
        renderResolutionStatus={(q) => (
          <div className="flex items-center justify-center gap-6">
            <BinaryCPBar question={question} size={"lg"} />
            <FontAwesomeIcon className="text-purple-700" icon={faArrowRight} />
            <QuestionResolutionChipFacade question={q} />
          </div>
        )}
      />

      <QuestionInfo question={question} />
    </div>
  );
};

const QuestionInfo: React.FC<{
  question: QuestionWithNumericForecasts;
}> = ({ question }) => {
  const t = useTranslations();

  const renderMessage = () => {
    switch (question.status) {
      case QuestionStatus.UPCOMING:
        return t("questionUpcomingMessage");
      case QuestionStatus.OPEN:
        return t("questionOpenMessage");
      case QuestionStatus.CLOSED:
        return t("questionClosedMessage");
      case QuestionStatus.RESOLVED:
        const probability =
          question.aggregations.recency_weighted.latest?.forecast_values?.[0] ??
          "?";
        const resolution =
          capitalize(question.resolution?.toString()) ?? t("unknown");
        return t.rich("questionResolvedMessage", {
          probability,
          resolution,
          b: (chunks) => <span className="font-bold">{chunks}</span>,
        });
      default:
        return null;
    }
  };

  return (
    <div
      className={cn(
        "mt-4 text-center text-blue-800 dark:text-gray-300",
        question.status !== QuestionStatus.RESOLVED && "mx-auto max-w-[170px]"
      )}
    >
      <p className="text-sm font-normal leading-[20px]">{renderMessage()}</p>
    </div>
  );
};

export default BinaryQuestionPrediction;
