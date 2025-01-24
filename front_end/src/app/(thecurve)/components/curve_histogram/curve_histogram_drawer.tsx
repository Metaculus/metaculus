"use client";

import { useTranslations } from "next-intl";
import React, { FC, useEffect, useRef, useState } from "react";

import { getPost } from "@/app/(main)/questions/actions";
import Button from "@/components/ui/button";
import LoadingSpinner from "@/components/ui/loading_spiner";
import { PostWithForecasts } from "@/types/post";
import { QuestionType } from "@/types/question";
import { generateCurveChoiceOptions } from "@/utils/forecasts";

import CurveHistogram from "./curve_histogram";

type Props = {
  postId: number;
  onNextQuestion?: () => void;
};

const CurveHistogramDrawer: FC<Props> = ({ postId, onNextQuestion }) => {
  const t = useTranslations();
  const [isLoading, setIsLoading] = useState(true);
  const [post, setPost] = useState<PostWithForecasts | null>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const nextBtnRef = useRef<HTMLButtonElement>(null);
  const [chartHeight, setChartHeight] = useState(65);

  useEffect(() => {
    const fetchPost = async (postId: number) => {
      try {
        setIsLoading(true);
        const postData = await getPost(postId);
        setPost(postData);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPost(postId);
  }, [postId]);

  useEffect(() => {
    if (!chartContainerRef.current) return;
    setChartHeight(Math.max(chartContainerRef.current?.clientHeight, 65));

    setTimeout(() => {
      nextBtnRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  }, [isLoading]);

  if (isLoading) {
    return (
      <div className="min-w-max p-5 md:rounded-b md:bg-gray-0 md:dark:bg-gray-0-dark">
        <LoadingSpinner />
      </div>
    );
  }

  if (
    post &&
    post.group_of_questions?.questions &&
    post.group_of_questions.questions[0]?.type === QuestionType.Binary
  ) {
    const histogramQuestion = post.group_of_questions.questions[0];
    const histogramData =
      histogramQuestion.aggregations.recency_weighted.latest?.histogram
        ?.at(0)
        ?.map((value, index) => ({
          x: index,
          y: value,
        }));
    const median =
      histogramQuestion.aggregations.recency_weighted.latest?.centers?.[0];
    const choiceOptions = generateCurveChoiceOptions(
      post.group_of_questions.questions
    );
    return (
      <div className="p-5 md:rounded-b md:bg-gray-0 md:dark:bg-gray-0-dark">
        <p className="m-0 text-gray-800 dark:text-gray-800-dark md:rounded-b">
          {t("curveHistogramHeader")}
        </p>

        <div className="mt-4 flex flex-col items-center rounded bg-[#A9C0D64D]/30 p-6 dark:bg-[#A9C0D64D]/30">
          <p className="m-0 w-full text-start text-sm font-medium leading-4 text-gray-700 dark:text-gray-700-dark">
            {t("communityPredictionLabel")}
          </p>
          <div className="mt-3" ref={chartContainerRef}>
            {!!histogramQuestion.aggregations.recency_weighted.latest
              ?.histogram && (
              <CurveHistogram
                choiceOptions={choiceOptions}
                histogramData={histogramData ?? []}
                median={median}
                color={"gray"}
                height={chartHeight}
              />
            )}
          </div>
        </div>
        <div className="mt-4 flex w-full justify-center">
          <Button
            ref={nextBtnRef}
            className="!bg-blue-900 !px-5 !text-lg !text-gray-200"
            onClick={() => {
              onNextQuestion?.();
            }}
          >
            {t("nextQuestion")}
          </Button>
        </div>
      </div>
    );
  }
  return null;
};

export default CurveHistogramDrawer;
