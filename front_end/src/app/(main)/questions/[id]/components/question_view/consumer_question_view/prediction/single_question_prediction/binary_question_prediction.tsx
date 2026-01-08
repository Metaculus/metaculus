"use client";

import { faArrowRightLong } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { capitalize } from "lodash";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";

import BinaryCPBar from "@/components/consumer_post_card/binary_cp_bar";
import { QuestionResolutionChipFacade } from "@/components/consumer_post_card/question_resolution_chip";
import PredictionBinaryInfo from "@/components/post_card/question_tile/prediction_binary_info";
import RichText from "@/components/rich_text";
import { QuestionStatus } from "@/types/post";
import { QuestionType, QuestionWithNumericForecasts } from "@/types/question";
import cn from "@/utils/core/cn";
import { getQuestionForecastAvailability } from "@/utils/questions/forecastAvailability";

type Props = {
  question: QuestionWithNumericForecasts;
  canPredict: boolean;
};

const UpcomingCPClient = dynamic(
  () => import("@/components/consumer_post_card/upcoming_cp"),
  { ssr: false }
);

const BinaryQuestionPrediction: React.FC<Props> = ({
  question,
  canPredict,
}) => {
  const forecastAvailability = getQuestionForecastAvailability(question);
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
        showMyPrediction
        question={question}
        canPredict={canPredict}
        size="lg"
        cpMovementVariant="chip"
        renderResolutionStatus={renderResolutionStatus}
      />
      <QuestionInfo
        question={question}
        cpRevealsOn={forecastAvailability?.cpRevealsOn ?? null}
      />
    </div>
  );
};

const QuestionInfo: React.FC<{
  question: QuestionWithNumericForecasts;
  cpRevealsOn: string | null;
}> = ({ question, cpRevealsOn }) => {
  const t = useTranslations();

  const getYesProbability = (
    q: QuestionWithNumericForecasts
  ): number | undefined => {
    if (q.type !== QuestionType.Binary) return undefined;
    const values =
      q.aggregations?.[q.default_aggregation_method]?.latest?.forecast_values;
    return values && values.length >= 2 ? values[1] : undefined;
  };

  const renderMessage = (): React.ReactNode => {
    switch (question.status) {
      case QuestionStatus.UPCOMING:
        return t("questionUpcomingMessage");
      case QuestionStatus.OPEN:
        if (cpRevealsOn) {
          return (
            <div className="flex min-w-[200px] max-w-[260px] flex-col justify-center gap-1 text-center">
              <div className="text-sm text-olive-700 dark:text-olive-700-dark md:text-base">
                {t("currentEstimate")}
              </div>
              <div className="text-xl font-bold text-olive-900 dark:text-olive-900-dark md:text-2xl">
                <UpcomingCPClient cpRevealsOn={cpRevealsOn} />
              </div>
            </div>
          );
        }
        return null;
      case QuestionStatus.CLOSED:
        return t("questionClosedMessage");
      case QuestionStatus.RESOLVED: {
        const pYes = getYesProbability(question);
        const probabilityDisplay = pYes == null ? "0" : (pYes * 100).toFixed(0);
        const resolution =
          capitalize(question.resolution?.toString() ?? "") || t("unknown");

        return (
          <RichText>
            {(tags) =>
              t.rich("questionResolvedMessage", {
                probability: probabilityDisplay,
                resolution,
                b: tags.strong,
                br: tags.br,
              })
            }
          </RichText>
        );
      }
      default:
        return null;
    }
  };

  const message = renderMessage();
  const isPlainText = typeof message === "string";

  return (
    <div
      className={cn(
        "mt-4 text-center text-blue-800 dark:text-blue-800-dark",
        question.status !== QuestionStatus.RESOLVED &&
          !cpRevealsOn &&
          "mx-auto max-w-[170px]"
      )}
    >
      {isPlainText ? (
        <p className="text-sm font-normal leading-[20px]">{message}</p>
      ) : (
        message
      )}
    </div>
  );
};

export default BinaryQuestionPrediction;
