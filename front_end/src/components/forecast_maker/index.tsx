"use client";

import { useTranslations } from "next-intl";
import { FC, ReactNode } from "react";

import PredictionStatusMessage from "@/components/forecast_maker/prediction_status_message";
import MarkdownEditor from "@/components/markdown_editor";
import SectionToggle from "@/components/ui/section_toggle";
import { useAuth } from "@/contexts/auth_context";
import { usePostTextSections } from "@/hooks/use_post_text_sections";
import { PostWithForecasts } from "@/types/post";
import {
  canPredictQuestion,
  isPostPrePrediction,
} from "@/utils/questions/predictions";

import ForecastMakerConditional from "./forecast_maker_conditional";
import ForecastMakerGroup from "./forecast_maker_group";
import QuestionForecastMaker from "./forecast_maker_question";

type Props = {
  post: PostWithForecasts;
  onPredictionSubmit?: () => void;
};

const ForecastMaker: FC<Props> = ({ post, onPredictionSubmit }) => {
  const t = useTranslations();
  const { user } = useAuth();
  const sections = usePostTextSections(post, { excludeFinePrint: true });

  const { group_of_questions: groupOfQuestions, conditional, question } = post;
  const canPredict = canPredictQuestion(post, user);
  const isPrePrediction = isPostPrePrediction(post);
  const predictLabel = isPrePrediction ? t("prePredict") : t("predict");

  const predictionMessage = <PredictionStatusMessage post={post} />;

  const infoDrawers = sections.length ? (
    <div className="flex flex-col gap-2">
      {sections.map((section) => (
        <SectionToggle
          key={section.title}
          title={section.title}
          variant="light"
        >
          <MarkdownEditor withCodeBlocks markdown={section.markdown} />
        </SectionToggle>
      ))}
    </div>
  ) : null;

  let content: ReactNode = null;
  if (groupOfQuestions) {
    content = (
      <ForecastMakerGroup
        post={post}
        questions={groupOfQuestions.questions}
        groupVariable={groupOfQuestions.group_variable}
        canPredict={canPredict}
        predictLabel={predictLabel}
        predictionMessage={predictionMessage}
        onPredictionSubmit={onPredictionSubmit}
      />
    );
  } else if (conditional) {
    content = (
      <ForecastMakerConditional
        post={post}
        conditional={conditional}
        canPredict={canPredict}
        predictLabel={predictLabel}
        predictionMessage={predictionMessage}
        onPredictionSubmit={onPredictionSubmit}
      />
    );
  } else if (question) {
    content = (
      <QuestionForecastMaker
        question={question}
        canPredict={canPredict}
        predictLabel={predictLabel}
        post={post}
        predictionMessage={predictionMessage}
        onPredictionSubmit={onPredictionSubmit}
      />
    );
  }

  if (!content) return null;

  return (
    <>
      {content}
      {infoDrawers}
    </>
  );
};

export default ForecastMaker;
