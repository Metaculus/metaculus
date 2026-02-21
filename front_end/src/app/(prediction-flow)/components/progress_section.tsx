"use client";

import { isNil } from "lodash";
import { useTranslations } from "next-intl";
import React, { FC, useMemo } from "react";

import {
  FlowStepperRoot,
  FlowStepperHeader,
  FlowStepperSegments,
  FlowStepperNav,
  FlowStepperNavPrev,
  FlowStepperNavNext,
  FlowStepperMenu,
  FlowStep,
} from "@/components/flow/flow_stepper";
import { isPostOpenQuestionPredicted } from "@/utils/forecasts/helpers";

import PredictionFlowMenu from "./prediction_flow_menu";
import { usePredictionFlow } from "./prediction_flow_provider";

const ProgressSection: FC = () => {
  const t = useTranslations();
  const {
    posts,
    currentPostId,
    isMenuOpen,
    setIsMenuOpen,
    flowType,
    postsLeft,
    changeActivePost,
  } = usePredictionFlow();

  const steps: FlowStep[] = useMemo(() => {
    return posts.map((post) => ({
      id: post.id,
      isDone: isNil(flowType) ? isPostOpenQuestionPredicted(post) : post.isDone,
    }));
  }, [posts, flowType]);

  const currentIndex = useMemo(
    () => posts.findIndex((post) => post.id === currentPostId),
    [posts, currentPostId]
  );

  const headerLabel = isNil(currentPostId)
    ? t("questionsTotal", { count: posts.length })
    : t("questionsLeft", { count: postsLeft });

  const nextLabel = t(
    isNil(flowType) && posts[currentIndex]
      ? isPostOpenQuestionPredicted(posts[currentIndex])
        ? "nextQuestion"
        : "skipQuestions"
      : posts[currentIndex]?.isDone
        ? "nextQuestion"
        : "skipQuestions"
  );

  const showNav = currentPostId !== null && !isMenuOpen;
  const prevDisabled = currentIndex <= 0;
  const nextDisabled = currentIndex > posts.length - 1 || currentIndex < 0;

  return (
    <FlowStepperRoot
      steps={steps}
      activeStepId={currentPostId}
      isMenuOpen={isMenuOpen}
      onToggleMenu={() => setIsMenuOpen(!isMenuOpen)}
      onSelectStep={(id) => changeActivePost(id as number)}
    >
      <FlowStepperHeader label={headerLabel} />

      <FlowStepperSegments />

      {showNav && (
        <FlowStepperNav>
          <FlowStepperNavPrev
            disabled={prevDisabled}
            onClick={() =>
              changeActivePost(posts[currentIndex - 1]?.id ?? null)
            }
          >
            {t("previous")}
          </FlowStepperNavPrev>

          <FlowStepperNavNext
            disabled={nextDisabled}
            onClick={() =>
              changeActivePost(posts[currentIndex + 1]?.id ?? null)
            }
          >
            {nextLabel}
          </FlowStepperNavNext>
        </FlowStepperNav>
      )}

      <FlowStepperMenu>
        <PredictionFlowMenu posts={posts} />
      </FlowStepperMenu>
    </FlowStepperRoot>
  );
};

export default ProgressSection;
