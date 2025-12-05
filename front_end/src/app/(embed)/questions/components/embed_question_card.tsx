import { Fragment } from "react";

import { PostWithForecasts } from "@/types/post";

import EmbedQuestionFooter from "./embed_question_footer";
import EmbedQuestionHeader from "./embed_question_header";
import EmbedQuestionPlot from "./embed_question_plot";
import { QuestionViewModeProvider } from "./question_view_mode_context";

type Props = {
  post: PostWithForecasts;
};

const EmbedQuestionCard: React.FC<Props> = ({ post }) => {
  return (
    <QuestionViewModeProvider mode="embed">
      <Fragment>
        <EmbedQuestionHeader post={post} />
        <EmbedQuestionPlot post={post} />
        <EmbedQuestionFooter post={post} />
      </Fragment>
    </QuestionViewModeProvider>
  );
};

export default EmbedQuestionCard;
