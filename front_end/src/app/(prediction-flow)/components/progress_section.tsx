"use client";

import { faBars, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { isNil } from "lodash";
import { useTranslations } from "next-intl";
import { FC, useMemo } from "react";

import PostStepButton from "@/app/(prediction-flow)/components/post_step_button";
import { usePredictionFlow } from "@/app/(prediction-flow)/components/prediction_flow_provider";
import Button from "@/components/ui/button";
import cn from "@/utils/core/cn";
import { isPostOpenQuestionPredicted } from "@/utils/forecasts/helpers";

import PredictionFlowMenu from "./prediction_flow_menu";

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

  const currentIndex = useMemo(
    () => posts.findIndex((post) => post.id === currentPostId),
    [posts, currentPostId]
  );

  const handleClick = (isPrevious: boolean) => {
    if (isPrevious ? currentIndex > 0 : currentIndex <= posts.length - 1) {
      changeActivePost(
        posts[isPrevious ? currentIndex - 1 : currentIndex + 1]?.id ?? null
      );
    }
  };

  return (
    <div className="relative flex max-h-[calc(100dvh-48px)] w-full flex-col rounded-b bg-gray-0 p-4 py-3 dark:bg-gray-0-dark sm:p-8 sm:py-[26px]">
      <div className="flex items-center justify-between">
        <p className="m-0 text-lg font-medium leading-7">
          {isNil(currentPostId)
            ? t("questionsTotal", { count: posts.length })
            : t("questionsLeft", { count: postsLeft })}
        </p>
        <Button
          variant="tertiary"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="h-8 w-8 rounded-full px-2 py-2"
        >
          <FontAwesomeIcon
            icon={isMenuOpen ? faXmark : faBars}
            className={cn({
              "h-[16px] w-[14px]": !isMenuOpen,
              "h-[16px] w-[16px]": isMenuOpen,
            })}
          />
        </Button>
      </div>
      {/* Questions bars */}
      <div className="mt-4 flex gap-0.5">
        {posts.map((post, index) => (
          <PostStepButton
            key={post.id}
            post={post}
            className={cn({
              "rounded-l": index === 0,
              "rounded-r": index === posts.length - 1,
            })}
          />
        ))}
      </div>
      {/* Navigation buttons */}
      {!isNil(currentPostId) && !isMenuOpen && (
        <div className="mt-4 flex justify-between gap-2">
          <Button
            variant="tertiary"
            onClick={() => handleClick(true)}
            disabled={currentIndex <= 0}
          >
            {t("previous")}
          </Button>
          <Button
            variant="tertiary"
            onClick={() => handleClick(false)}
            disabled={currentIndex > posts.length - 1}
            className="capitalize"
          >
            {t(
              isNil(flowType) && posts[currentIndex]
                ? isPostOpenQuestionPredicted(posts[currentIndex])
                  ? "nextQuestion"
                  : "skipQuestions"
                : posts[currentIndex]?.isDone
                  ? "nextQuestion"
                  : "skipQuestions"
            )}
          </Button>
        </div>
      )}
      {isMenuOpen && <PredictionFlowMenu posts={posts} />}
    </div>
  );
};

export default ProgressSection;
