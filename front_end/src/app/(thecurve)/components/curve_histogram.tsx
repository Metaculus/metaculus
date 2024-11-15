import React, { FC } from "react";

import { PostWithForecasts } from "@/types/post";
import Histogram from "@/components/charts/histogram";
import { QuestionType } from "@/types/question";

type Props = {
  post: PostWithForecasts;
};

const CurveHistogram: FC<Props> = ({ post }) => {
  if (
    post.group_of_questions?.questions &&
    post.group_of_questions.questions[0].type === QuestionType.Binary
  ) {
    const histogramQuestion = post.group_of_questions.questions[0];
    if (!histogramQuestion.aggregations.recency_weighted.latest?.histogram) {
      return null;
    }
    const histogramData =
      histogramQuestion.aggregations.recency_weighted.latest?.histogram?.map(
        (value, index) => ({
          x: index,
          y: value,
        })
      );
    const median =
      histogramQuestion.aggregations.recency_weighted.latest.centers![0];
    const mean =
      histogramQuestion.aggregations.recency_weighted.latest.means![0];
    return (
      <div>
        <Histogram
          histogramData={histogramData}
          median={median}
          mean={mean}
          color={"gray"}
        />
      </div>
    );
  }
  return null;
};

export default CurveHistogram;
