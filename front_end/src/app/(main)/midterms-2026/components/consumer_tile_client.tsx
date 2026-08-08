"use client";

import { FC } from "react";

import ConsumerQuestionTile from "@/components/consumer_post_card/consumer_question_tile";
import { QuestionWithForecasts } from "@/types/question";

type Props = {
  question: QuestionWithForecasts;
};

const ConsumerTileClient: FC<Props> = ({ question }) => {
  return <ConsumerQuestionTile question={question} />;
};

export default ConsumerTileClient;
