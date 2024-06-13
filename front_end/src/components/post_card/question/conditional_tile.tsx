import { FC, PropsWithChildren } from "react";

import { PostConditional } from "@/types/post";
import { QuestionWithForecasts } from "@/types/question";

type Props = {
  conditional: PostConditional<QuestionWithForecasts>;
};

const ConditionalTile: FC<Props> = ({ conditional }) => {
  return (
    <div className="grid grid-cols-[minmax(0,_1fr)_72px_minmax(0,_1fr)]">
      <div className="flex flex-col justify-center">
        <Card label="Condition" title={conditional.condition.title} />
      </div>
      <div />
      <div className="flex flex-col gap-3">
        <Card title={conditional.question_yes.title}>TODO: chart</Card>
        <Card title={conditional.question_no.title}>TODO: chart</Card>
      </div>
    </div>
  );
};

type CardProps = {
  title: string;
  label?: string;
};

const Card: FC<PropsWithChildren<CardProps>> = ({ title, label, children }) => {
  return (
    <div className="flex min-h-20 flex-col gap-2 border border-blue-500 p-3 dark:border-blue-500-dark">
      {!!label && (
        <span className="uppercase text-blue-700 dark:text-blue-700">
          {label}
        </span>
      )}
      <h4 className="m-0">{title}</h4>
      {children}
    </div>
  );
};

export default ConditionalTile;
