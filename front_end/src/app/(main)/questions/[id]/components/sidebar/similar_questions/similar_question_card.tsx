import Link from "next/link";
import { FC } from "react";

import { PostWithForecasts } from "@/types/post";
import { QuestionType } from "@/types/question";

import SimilarPredictionChip from "./similar_question_prediction_chip";
import QuestionStatus from "./similar_question_status";

type Props = {
  question: PostWithForecasts;
};

const QuestionCard: FC<Props> = ({ question }) => {
  return (
    <Link href={`/questions/${question.id}`} className="w-full no-underline">
      <div className="QuestionCard border-metac-blue-500 dark:border-metac-blue-600 gap-2 rounded border px-4 py-3">
        <div className="flex flex-col gap-1.5">
          <h4 className="text-metac-gray-800 dark:text-metac-gray-800-dark my-0">
            {question.title}
          </h4>
          {!!question.question &&
            question.question.type === QuestionType.Binary && (
              <div className="flex flex-row gap-2">
                <SimilarPredictionChip
                  question={question.question}
                  curationStatus={question.status}
                />
              </div>
            )}
          {/* TODO: add user prediction chip after BE changes
            {question.hasPlayerPrediction() && (
              <div className="text-orange-700 dark:text-orange-400 flex flex-row gap-0.5 text-xs font-medium">
                <FontAwesomeIcon
                  icon={icon({ name: "user", style: "regular" })}
                  className="QuestionCard-prediction-icon text-orange-800 dark:text-orange-800-dark"
                />
                <Prediction
                  tlist={question.predictionFormatter.formatPrediction(
                    userPrediction
                  )}
                />
              </div>
            )}
         */}
          <div>
            <QuestionStatus question={question} />
          </div>
        </div>
      </div>
    </Link>
  );
};

export default QuestionCard;
