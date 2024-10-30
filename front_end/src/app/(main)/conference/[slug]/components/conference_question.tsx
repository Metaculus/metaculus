"use client";

import { round } from "lodash";
import React, { useState, useEffect } from "react";

import BinarySlider from "@/app/(main)/questions/[id]/components/forecast_maker/binary_slider";
import { BINARY_FORECAST_PRECISION } from "@/app/(main)/questions/[id]/components/forecast_maker/binary_slider";
import { getPost } from "@/app/(main)/questions/actions";
import { createForecasts } from "@/app/(main)/questions/actions";
import MarkdownEditor from "@/components/markdown_editor";
import { PostWithForecasts, QuestionStatus } from "@/types/post";
import { QuestionType } from "@/types/question";

interface ConferenceQuestionProps {
  questionPostId: number;
}

const ConferenceQuestion = ({ questionPostId }: ConferenceQuestionProps) => {
  const [questionPost, setQuestionPost] = useState<PostWithForecasts | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPrediction, setCurrentPrediction] = useState<number | null>(
    null
  );
  const [lastSubmittedForecast, setLastSubmittedForecast] = useState<
    number | null
  >(null);
  const [communityForecast, setCommunityForecast] = useState<number | null>(
    null
  );

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        setLoading(true);
        const fetchedQuestion = await getPost(questionPostId);
        setQuestionPost(fetchedQuestion);

        const communityPrediction =
          fetchedQuestion.question?.aggregations.recency_weighted.latest
            ?.centers?.[0] ?? null;
        setCommunityForecast(communityPrediction);

        const userPrediction =
          fetchedQuestion.question?.my_forecasts?.latest?.forecast_values[1] ??
          null;
        setCurrentPrediction(userPrediction);
        setLastSubmittedForecast(userPrediction);

        setError(null);
      } catch (err) {
        console.error("Error fetching question:", err);
        setError("Failed to load question");
      } finally {
        setLoading(false);
      }
    };
    fetchQuestion();
  }, [questionPostId]);

  useEffect(() => {
    console.log(
      "Current State: Question ",
      questionPostId,
      " Last submitted forecast ",
      lastSubmittedForecast,
      " Community forecast ",
      communityForecast
    );
  }, [lastSubmittedForecast, communityForecast, questionPostId]);

  const handleSubmit = async () => {
    if (!currentPrediction || !questionPost) return;

    try {
      setIsSubmitting(true);
      const forecastValue = round(currentPrediction, BINARY_FORECAST_PRECISION);
      if (!questionPost.question) {
        throw new Error("Question post did not have a question");
      }
      const error = await createForecasts(questionPost.id, [
        {
          questionId: questionPost.question.id,
          forecastData: {
            continuousCdf: null,
            probabilityYes: forecastValue,
            probabilityYesPerCategory: null,
          },
        },
      ]);
      if (error) {
        throw error;
      }
      setLastSubmittedForecast(forecastValue);
    } catch (err) {
      console.error("Error submitting forecast:", err);
      setError("Failed to submit forecast. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateCurrentPredictionUsingPercentage = (value: number | null) => {
    const prediction_as_decimal = value ? value / 100 : null;
    setCurrentPrediction(prediction_as_decimal);
  };

  if (loading) {
    return <div className="text-center">Loading question...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }

  if (!questionPost) {
    return <div className="text-center">No question found.</div>;
  }

  return (
    <div className="w-full">
      <div className="text-center">
        <h2 className="mb-8 text-3xl font-bold">{questionPost.title}</h2>
        <div className="rounded-md bg-blue-200 py-4 dark:bg-blue-800">
          {questionPost.question?.type !== QuestionType.Binary ? (
            <div className="text-center text-gray-700 dark:text-gray-300">
              Only binary questions are supported in conference mode
            </div>
          ) : !questionPost.question?.status ||
            questionPost.question.status !== QuestionStatus.OPEN ? (
            <div className="text-center text-gray-700 dark:text-gray-300">
              This question is not open for predictions
            </div>
          ) : (
            <>
              <BinarySlider
                forecast={
                  lastSubmittedForecast
                    ? round(lastSubmittedForecast * 100, 1)
                    : null
                }
                onChange={updateCurrentPredictionUsingPercentage}
                isDirty={true}
                communityForecast={communityForecast}
                onBecomeDirty={() => {}}
                disabled={false}
                helperDisplay={true}
              />
              <div className="mt-6 flex justify-center">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !currentPrediction}
                  className="rounded bg-blue-400 px-6 py-4 font-semibold text-blue-800 hover:bg-blue-500 dark:bg-blue-700 dark:text-blue-200 dark:hover:bg-blue-600"
                >
                  {isSubmitting ? "Submitting..." : "Submit"}
                </button>
              </div>
            </>
          )}
        </div>
        <div className="mb-6 text-left">
          <MarkdownEditor
            markdown={questionPost.question?.description || ""}
            mode="read"
          />
        </div>
      </div>
    </div>
  );
};

export default ConferenceQuestion;
