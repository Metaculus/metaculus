"use client";

import { faArrowRightLong } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { capitalize } from "lodash";
import { useTranslations } from "next-intl";

import BinaryCPBar from "@/components/consumer_post_card/binary_cp_bar";
import { QuestionResolutionChipFacade } from "@/components/consumer_post_card/question_resolution_chip";
import PredictionBinaryInfo from "@/components/post_card/question_tile/prediction_binary_info";
import RichText from "@/components/rich_text";
import { QuestionStatus } from "@/types/post";
import { QuestionWithNumericForecasts } from "@/types/question";
import cn from "@/utils/core/cn";

type Props = {
  question: QuestionWithNumericForecasts;
  canPredict: boolean;
};

const BinaryQuestionPrediction: React.FC<Props> = ({
  question,
  canPredict,
}) => {
  const renderResolutionStatus = (q: QuestionWithNumericForecasts) => (
    <div className="flex items-center justify-center gap-6">
      <BinaryCPBar question={question} size={"lg"} className="hidden sm:flex" />
      <BinaryCPBar
        question={question}
        size={"md"}
        className="flex min-w-0 sm:hidden"
      />
      <FontAwesomeIcon
        className="text-purple-700 dark:text-purple-700-dark"
        icon={faArrowRightLong}
      />
      <QuestionResolutionChipFacade
        question={q}
        size="lg"
        className="hidden sm:flex"
      />
      <QuestionResolutionChipFacade
        question={q}
        size="md"
        className="flex sm:hidden"
      />
    </div>
  );

  return (
    <div className="mx-auto mb-7 space-y-7 pt-5 lg:px-10">
      <PredictionBinaryInfo
        showMyPrediction={true}
        question={question}
        canPredict={canPredict}
        size="lg"
        cpMovementVariant="chip"
        renderResolutionStatus={renderResolutionStatus}
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
          question.aggregations[question.default_aggregation_method]?.latest
            ?.forecast_values?.[0] ?? "?";
        const resolution =
          capitalize(question.resolution?.toString()) ?? t("unknown");
        return (
          <RichText>
            {(tags) =>
              t.rich("questionResolvedMessage", {
                probability,
                resolution,
                b: tags.strong,
                br: tags.br,
              })
            }
          </RichText>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={cn(
        "mt-4 text-center text-blue-800 dark:text-blue-800-dark",
        question.status !== QuestionStatus.RESOLVED && "mx-auto max-w-[170px]"
      )}
    >
      <p className="text-sm font-normal leading-[20px]">{renderMessage()}</p>
    </div>
  );
};

export default BinaryQuestionPrediction;
