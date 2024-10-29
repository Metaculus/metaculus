import React, { useState, useEffect } from "react";

import { getPost } from "@/app/(main)/conference/api-actions";
import { PostWithForecasts } from "@/types/post";

import BinarySlider from "@/app/(main)/questions/[id]/components/forecast_maker/binary_slider";
import { onboardingStyles } from "./OnboardingStyles";

import { createForecasts } from "@/app/(main)/questions/actions";
import { BINARY_FORECAST_PRECISION } from "@/app/(main)/questions/[id]/components/forecast_maker/binary_slider";

import { round } from "lodash";

interface ConferenceQuestionProps {
  questionId: number;
  handleNavigation: (direction: 'forward' | 'previous' | 'back') => void;
  prediction: number | null;
  setPrediction: (prediction: number) => void;
}

const ConferenceQuestion = ({ questionId, handleNavigation, prediction, setPrediction }: ConferenceQuestionProps) => {
  const [question, setQuestion] = useState<PostWithForecasts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [communityForecast, setCommunityForecast] = useState<number>(0.5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        setLoading(true);
        const fetchedQuestion = await getPost(questionId);
        setQuestion(fetchedQuestion);
        
        const communityPrediction = fetchedQuestion.question?.aggregations.recency_weighted.latest?.centers?.[0];
        setCommunityForecast(communityPrediction ? communityPrediction: .5);
        
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

  const handleSubmit = async () => {
    if (!prediction || !question) return;
  
    try {
      setIsSubmitting(true);
      const forecastValue = round(prediction / 100, BINARY_FORECAST_PRECISION);
      
      await createForecasts(question.id, [{
        questionId: question.id,
        forecastData: {
          continuousCdf: null,
          probabilityYes: forecastValue,
          probabilityYesPerCategory: null,
        }
      }]);
  
      handleNavigation('forward');
    } catch (err) {
      console.error("Error submitting forecast:", err);
      setError("Failed to submit forecast. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
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
    <div className="text-center">
      <h2 className="mb-8 text-3xl font-bold">{question.title}</h2>
      
      <div className="rounded-md bg-blue-200 py-4 dark:bg-blue-800">
        <BinarySlider
          forecast={prediction}
          onChange={setPrediction}
          isDirty={true}
          communityForecast={communityForecast}
          onBecomeDirty={() => {}}
          disabled={false}
          helperDisplay={true}
        />
        <div className="mt-6 flex justify-center">
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting || !prediction} 
            className={onboardingStyles.button}
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConferenceQuestion;