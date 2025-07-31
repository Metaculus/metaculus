import { useTranslations } from "next-intl";

import PredictionBinaryInfo from "@/components/post_card/question_tile/prediction_binary_info";
import { QuestionStatus } from "@/types/post";
import { QuestionWithNumericForecasts } from "@/types/question";

type Props = {
  question: QuestionWithNumericForecasts;
  canPredict: boolean;
};

const BinaryQuestionPrediction: React.FC<Props> = ({
  question,
  canPredict,
}) => {
  return (
    <div className="mx-auto max-w-[250px] space-y-7 px-10 py-5">
      <PredictionBinaryInfo
        showMyPrediction={true}
        question={question}
        canPredict={canPredict}
        size="lg"
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
          question.resolution?.toString().toUpperCase() ?? t("unknown");
        return t("questionResolvedMessage", {
          probability,
          resolution,
        });
      default:
        return null;
    }
  };

  return (
    <div className="mt-4 text-center text-blue-800 dark:text-gray-300">
      <p className="text-sm font-normal leading-[20px]">{renderMessage()}</p>
    </div>
  );
};

export default BinaryQuestionPrediction;
