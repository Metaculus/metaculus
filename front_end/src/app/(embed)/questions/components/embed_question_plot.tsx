import DetailedGroupCard from "@/components/detailed_question_card/detailed_group_card";
import DetailedQuestionCard from "@/components/detailed_question_card/detailed_question_card";
import { EmbedChartType, TimelineChartZoomOption } from "@/types/charts";
import { PostWithForecasts } from "@/types/post";
import {
  isConditionalPost,
  isGroupOfQuestionsPost,
  isQuestionPost,
} from "@/utils/questions/helpers";

import EmbedConditionalPlot from "./embed_conditional_plot";
import { EmbedTheme } from "../constants/embed_theme";
import { getEmbedAccentColor } from "../helpers/embed_theme";

type Props = {
  post: PostWithForecasts;
  chartHeight?: number;
  onLegendHeightChange?: (height: number) => void;
  theme?: EmbedTheme;
  defaultZoom?: TimelineChartZoomOption;
  embedChartType?: EmbedChartType;
};

const EmbedQuestionPlot: React.FC<Props> = ({
  post,
  chartHeight,
  onLegendHeightChange,
  theme,
  defaultZoom,
  embedChartType,
}) => {
  const isGroup = isGroupOfQuestionsPost(post);
  const accent = getEmbedAccentColor(theme);
  return (
    <>
      {isConditionalPost(post) && (
        <EmbedConditionalPlot post={post} theme={theme} />
      )}
      {isQuestionPost(post) && (
        <DetailedQuestionCard
          post={post}
          embedChartHeight={chartHeight}
          onLegendHeightChange={onLegendHeightChange}
          chartTheme={theme?.chart}
          colorOverride={accent}
          defaultZoom={defaultZoom}
          embedChartType={embedChartType}
        />
      )}
      {isGroup && (
        <DetailedGroupCard
          post={post}
          embedChartHeight={chartHeight}
          onLegendHeightChange={onLegendHeightChange}
          chartTheme={theme?.chart}
          defaultZoom={defaultZoom}
        />
      )}
    </>
  );
};

export default EmbedQuestionPlot;
