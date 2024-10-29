import React, { useState, useEffect } from "react";

import { getPost } from "@/app/(main)/conference/api-actions";
import { PostWithForecasts } from "@/types/post";


import BinarySlider, {
  BINARY_FORECAST_PRECISION,
} from "@/app/(main)/questions/[id]/components/forecast_maker/binary_slider";

const ConferenceQuestion = ({ questionId }: { questionId: number }) => {
  const [question, setQuestion] = useState<PostWithForecasts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<number | null>(null);
  const [communityForecast, setCommunityForecast] = useState<number>(0.5);

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        setLoading(true);
        const fetchedQuestion = await getPost(questionId);
        setQuestion(fetchedQuestion);
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
      <BinarySlider
        forecast={prediction}
        onChange={(value) => {
          setPrediction(value);
        }}
        isDirty={true}
        communityForecast={communityForecast}
        onBecomeDirty={() => {}}
        disabled={false}
        // helperDisplay={true}
      />
    </div>
  );
};

export default ConferenceQuestion;
