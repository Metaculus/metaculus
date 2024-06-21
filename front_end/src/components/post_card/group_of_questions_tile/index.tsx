import { FC } from "react";

import GroupNumericTile from "@/components/post_card/group_of_questions_tile/group_numeric_tile";
import { PostStatus } from "@/types/post";
import {
  QuestionType,
  QuestionWithForecasts,
  QuestionWithNumericForecasts,
} from "@/types/question";
import {
  generateChoiceItemsFromBinaryGroup,
  getGroupQuestionsTimestamps,
} from "@/utils/charts";

import MultipleChoiceTile from "../multiple_choice_tile";

type Props = {
  questions: QuestionWithForecasts[];
  curationStatus: PostStatus;
};

const GroupOfQuestionsTile: FC<Props> = ({ questions, curationStatus }) => {
  const tileType = questions.at(0)?.type;

  if (!tileType) {
    return <div>Forecasts data is empty</div>;
  }

  switch (tileType) {
    case QuestionType.Binary: {
      const visibleChoicesCount = 3;
      const timestamps = getGroupQuestionsTimestamps(
        questions as QuestionWithNumericForecasts[]
      );
      const choices = generateChoiceItemsFromBinaryGroup(
        questions as QuestionWithNumericForecasts[],
        { activeCount: visibleChoicesCount }
      );
      return (
        <MultipleChoiceTile
          choices={choices}
          timestamps={timestamps}
          visibleChoicesCount={visibleChoicesCount}
        />
      );
    }
    case QuestionType.Numeric:
    case QuestionType.Date:
      return (
        <GroupNumericTile
          questions={questions as QuestionWithNumericForecasts[]}
          curationStatus={curationStatus}
        />
      );
    default:
      return null;
  }
};

export default GroupOfQuestionsTile;
