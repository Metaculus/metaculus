import DetailedGroupCard from "@/components/detailed_question_card/detailed_group_card";
import DetailedQuestionCard from "@/components/detailed_question_card/detailed_question_card";
import { PostWithForecasts } from "@/types/post";
import {
  isGroupOfQuestionsPost,
  isQuestionPost,
} from "@/utils/questions/helpers";

import { EmbedTheme } from "../constants/embed_theme";
import { getEmbedAccentColor } from "../helpers/embed_theme";

type Props = {
  post: PostWithForecasts;
  chartHeight?: number;
  onLegendHeightChange?: (height: number) => void;
  theme?: EmbedTheme;
};

const EmbedQuestionPlot: React.FC<Props> = ({
  post,
  chartHeight,
  onLegendHeightChange,
  theme,
}) => {
  const isGroup = isGroupOfQuestionsPost(post);
  const accent = getEmbedAccentColor(theme);
  return (
    <>
      {isQuestionPost(post) && (
        <DetailedQuestionCard
          post={post}
          embedChartHeight={chartHeight}
          onLegendHeightChange={onLegendHeightChange}
          chartTheme={theme?.chart}
          colorOverride={accent}
        />
      )}
      {isGroup && (
        <DetailedGroupCard
          post={post}
          embedChartHeight={chartHeight}
          onLegendHeightChange={onLegendHeightChange}
          chartTheme={theme?.chart}
        />
      )}
    </>
  );
};

export default EmbedQuestionPlot;
