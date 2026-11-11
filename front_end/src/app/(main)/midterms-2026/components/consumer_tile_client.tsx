"use client";

import { FC } from "react";

import ConsumerQuestionTile from "@/components/consumer_post_card/consumer_question_tile";
import { QuestionWithForecasts } from "@/types/question";

type Props = {
  question: QuestionWithForecasts;
  cpLabel?: string;
};

const ConsumerTileClient: FC<Props> = ({ question, cpLabel }) => {
  return <ConsumerQuestionTile question={question} cpLabel={cpLabel} />;
};

export default ConsumerTileClient;
