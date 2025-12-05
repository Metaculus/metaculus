import { Fragment, useMemo, useState } from "react";

import { PostWithForecasts } from "@/types/post";

import EmbedQuestionFooter from "./embed_question_footer";
import EmbedQuestionHeader from "./embed_question_header";
import EmbedQuestionPlot from "./embed_question_plot";
import { QuestionViewModeProvider } from "./question_view_mode_context";

type Props = {
  post: PostWithForecasts;
};

const EmbedQuestionCard: React.FC<Props> = ({ post }) => {
  const [headerHeight, setHeaderHeight] = useState(0);

  const chartHeight = useMemo(() => {
    const MIN_HEADER = 50;
    const MAX_HEADER = 100;
    const MIN_CHART = 120;
    const MAX_CHART = 170;

    if (!headerHeight) return MAX_CHART;

    const clampedHeader = Math.min(
      MAX_HEADER,
      Math.max(MIN_HEADER, headerHeight)
    );
    const t = (clampedHeader - MIN_HEADER) / (MAX_HEADER - MIN_HEADER);

    return Math.round(MAX_CHART + 8 - t * (MAX_CHART - MIN_CHART));
  }, [headerHeight]);

  return (
    <QuestionViewModeProvider mode="embed">
      <Fragment>
        <EmbedQuestionHeader post={post} onHeightChange={setHeaderHeight} />
        <EmbedQuestionPlot post={post} chartHeight={chartHeight} />
        <EmbedQuestionFooter post={post} />
      </Fragment>
    </QuestionViewModeProvider>
  );
};

export default EmbedQuestionCard;
