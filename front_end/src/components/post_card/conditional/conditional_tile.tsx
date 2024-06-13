import { FC } from "react";

import ConditionalCard from "@/components/post_card/conditional/conditional_card";
import { PostConditional } from "@/types/post";
import { QuestionWithForecasts } from "@/types/question";

type Props = {
  conditional: PostConditional<QuestionWithForecasts>;
};

const ConditionalTile: FC<Props> = ({ conditional }) => {
  return (
    <div className="grid grid-cols-[minmax(0,_1fr)_72px_minmax(0,_1fr)]">
      <div className="flex flex-col justify-center">
        <ConditionalCard
          label="Condition"
          title={conditional.condition.title}
        />
      </div>
      <div />
      <div className="flex flex-col gap-3">
        <ConditionalCard title={conditional.question_yes.title}>
          TODO: chart {conditional.question_yes.type}
        </ConditionalCard>
        <ConditionalCard title={conditional.question_no.title}>
          TODO: chart {conditional.question_yes.type}
        </ConditionalCard>
      </div>
    </div>
  );
};

export default ConditionalTile;
