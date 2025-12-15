import { Fragment, useEffect, useMemo, useState } from "react";

import { PostWithForecasts } from "@/types/post";

import EmbedQuestionFooter from "./embed_question_footer";
import EmbedQuestionHeader from "./embed_question_header";
import EmbedQuestionPlot from "./embed_question_plot";
import { QuestionViewModeProvider } from "./question_view_mode_context";
import { EmbedTheme } from "../constants/embed_theme";
import { EmbedSize, getEmbedChartHeight } from "../helpers/embed_chart_height";

type Props = {
  post: PostWithForecasts;
  ogMode?: boolean;
  size: EmbedSize;
  theme?: EmbedTheme;
  titleOverride?: string;
};

const EmbedQuestionCard: React.FC<Props> = ({
  post,
  ogMode,
  size,
  theme,
  titleOverride,
}) => {
  const [headerHeight, setHeaderHeight] = useState(0);
  const [legendHeight, setLegendHeight] = useState(0);
  const [ogReady, setOgReady] = useState(!ogMode);

  const chartHeight = useMemo(
    () =>
      getEmbedChartHeight({
        post,
        ogMode,
        size,
        headerHeight,
        legendHeight,
      }),
    [post, ogMode, size, headerHeight, legendHeight]
  );

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
        <EmbedQuestionHeader
          post={post}
          onHeightChange={setHeaderHeight}
          titleStyle={theme?.title}
          titleOverride={titleOverride}
          theme={theme}
        />
        <EmbedQuestionPlot
          post={post}
          chartHeight={chartHeight}
          onLegendHeightChange={setLegendHeight}
          theme={theme}
        />
        <EmbedQuestionFooter ogReady={ogReady} post={post} />
      </Fragment>
    </QuestionViewModeProvider>
  );
};

export default EmbedQuestionCard;
