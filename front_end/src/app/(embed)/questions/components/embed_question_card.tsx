import { Fragment, useEffect, useMemo, useState } from "react";

import { PostWithForecasts } from "@/types/post";
import { QuestionType } from "@/types/question";

import EmbedQuestionFooter from "./embed_question_footer";
import EmbedQuestionHeader from "./embed_question_header";
import EmbedQuestionPlot from "./embed_question_plot";
import { QuestionViewModeProvider } from "./question_view_mode_context";

type Props = {
  post: PostWithForecasts;
  ogMode?: boolean;
};

const EmbedQuestionCard: React.FC<Props> = ({ post, ogMode }) => {
  const [headerHeight, setHeaderHeight] = useState(0);
  const [ogReady, setOgReady] = useState(!ogMode);

  const chartHeight = useMemo(() => {
    const MIN_HEADER = 50;
    const MAX_HEADER = 100;

    const isMC = post.question?.type === QuestionType.MultipleChoice;
    const MIN_CHART = isMC ? (ogMode ? 120 : 73) : 120;
    const MAX_CHART = isMC ? 124 : 170;

    if (!headerHeight) return MAX_CHART;

    const clampedHeader = Math.min(
      MAX_HEADER,
      Math.max(MIN_HEADER, headerHeight)
    );
    const t = (clampedHeader - MIN_HEADER) / (MAX_HEADER - MIN_HEADER);

    const fudge = isMC ? 0 : 8;

    return Math.round(MAX_CHART + fudge - t * (MAX_CHART - MIN_CHART));
  }, [headerHeight, post.question?.type, ogMode]);

  useEffect(() => {
    if (!ogMode) return;

    if (!headerHeight) {
      setOgReady(false);
      return;
    }

    let raf1 = 0;
    let raf2 = 0;

    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        setOgReady(true);
      });
    });

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [ogMode, headerHeight, chartHeight]);

  return (
    <QuestionViewModeProvider mode="embed">
      <Fragment>
        <EmbedQuestionHeader post={post} onHeightChange={setHeaderHeight} />
        <EmbedQuestionPlot post={post} chartHeight={chartHeight} />
        <EmbedQuestionFooter ogReady={ogReady} post={post} />
      </Fragment>
    </QuestionViewModeProvider>
  );
};

export default EmbedQuestionCard;
