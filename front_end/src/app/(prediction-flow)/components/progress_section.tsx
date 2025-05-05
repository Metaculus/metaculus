"use client";

import { faBars, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC, useMemo, useState } from "react";

import PostStepButton from "@/app/(prediction-flow)/components/post_step_button";
import { usePredictionFlow } from "@/app/(prediction-flow)/components/prediction_flow_provider";
import Button from "@/components/ui/button";
import cn from "@/utils/core/cn";
import { isPostPredicted } from "@/utils/forecasts/helpers";

import PredictionFlowMenu from "./prediction_flow_menu";

type Props = {
  tournamentId: number;
};

const ProgressSection: FC<Props> = ({ tournamentId }) => {
  const t = useTranslations();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { posts, setPosts, currentPostId, setCurrentPostId } =
    usePredictionFlow();
  const postsLeft = posts.filter((post) => !isPostPredicted(post));
  const currentIndex = useMemo(
    () => posts.findIndex((post) => post.id === currentPostId),
    [posts, currentPostId]
  );

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setPosts(
        posts.map((post) => {
          if (post.id === currentPostId) {
            return { ...post, isDone: true };
          }
          return post;
        })
      );
      setCurrentPostId(posts[currentIndex - 1]?.id ?? 0);
    }
  };
  const handleSkip = () => {
    if (currentIndex < posts.length - 1) {
      setPosts(
        posts.map((post) => {
          if (post.id === currentPostId) {
            return { ...post, isDone: true };
          }
          return post;
        })
      );
      setCurrentPostId(posts[currentIndex + 1]?.id ?? 0);
    }
  };

  return (
    <div className="relative flex max-h-[calc(100vh-48px)] w-full flex-col rounded-b bg-gray-0 p-4 py-3 dark:bg-gray-0-dark sm:p-8 sm:py-[26px]">
      <p className="m-0 text-xs font-medium leading-4">
        {posts[currentIndex]?.title}
      </p>
      <div className="flex items-center justify-between">
        <p className="m-0 text-lg font-medium leading-7">
          {t("questionsLeft", { count: postsLeft.length })}
        </p>
        <Button
          variant="tertiary"
          onClick={() => setIsMenuOpen((prev) => !prev)}
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
              "rounded-l-full": index === 0,
              "rounded-r-full": index === posts.length - 1,
            })}
          />
        ))}
      </div>
      {/* Navigation buttons */}
      {posts.some((post) => !post.isDone) &&
        currentIndex !== posts.length - 1 && (
          <div className="mt-4 flex justify-between gap-2">
            <Button
              variant="tertiary"
              onClick={handlePrevious}
              disabled={currentIndex <= 0}
            >
              {t("previous")}
            </Button>
            <Button
              variant="tertiary"
              onClick={handleSkip}
              disabled={currentIndex >= posts.length - 1}
            >
              {t("skipQuestions")}
            </Button>
          </div>
        )}
      {isMenuOpen && <PredictionFlowMenu posts={posts} />}
    </div>
  );
};

export default ProgressSection;
