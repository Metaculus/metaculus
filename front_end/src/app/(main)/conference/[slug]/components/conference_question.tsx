import { round } from "lodash";
import React, { useState, useEffect } from "react";

import BinarySlider from "@/app/(main)/questions/[id]/components/forecast_maker/binary_slider";
import { BINARY_FORECAST_PRECISION } from "@/app/(main)/questions/[id]/components/forecast_maker/binary_slider";
import { getPost } from "@/app/(main)/questions/actions";
import { createForecasts } from "@/app/(main)/questions/actions";
import { PostWithForecasts } from "@/types/post";

import { conferenceStyles } from "./conference_styles";
import KeyFactors from "./key_factors";

interface ConferenceQuestionProps {
  questionId: number;
}

const ConferenceQuestion = ({ questionId }: ConferenceQuestionProps) => {
  const [question, setQuestion] = useState<PostWithForecasts | null>(null);
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
  ); // Will showing this bias participants or help them make better forecasts?

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        setLoading(true);
        const fetchedQuestion = await getPost(questionId);
        setQuestion(fetchedQuestion);

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
        setError("Failed to load question. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchQuestion();
  }, [questionId]);

  useEffect(() => {
    console.log(
      "Current State: Question ",
      questionId,
      " Last submitted forecast ",
      lastSubmittedForecast,
      " Community forecast ",
      communityForecast
    );
  }, [lastSubmittedForecast, communityForecast, questionId]);

  const handleSubmit = async () => {
    if (!currentPrediction || !question) return;

    try {
      setIsSubmitting(true);
      const forecastValue = round(currentPrediction, BINARY_FORECAST_PRECISION);
      const error = await createForecasts(question.id, [
        {
          questionId: question.id,
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

  if (!question) {
    return <div className="text-center">No question found.</div>;
  }

  return (
    <div className="w-full">
      <div className="text-center">
        <h2 className="mb-8 text-3xl font-bold">{question.title}</h2>
        <div className="rounded-md bg-blue-200 py-4 dark:bg-blue-800">
          <BinarySlider
            forecast={
              lastSubmittedForecast ? lastSubmittedForecast * 100 : null
            } // As of 10/29/2024, You must pass in a percentage, not a decimal for the forecast
            onChange={updateCurrentPredictionUsingPercentage} // Give a percentage back
            isDirty={true}
            communityForecast={communityForecast} // Pass in a decimal not a percentage
            onBecomeDirty={() => {}}
            disabled={false}
            helperDisplay={true}
          />
          <div className="mt-6 flex justify-center">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !currentPrediction}
              className={conferenceStyles.button}
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        </div>
        <KeyFactors questionId={question} />
      </div>
    </div>
  );
};

export default ConferenceQuestion;
