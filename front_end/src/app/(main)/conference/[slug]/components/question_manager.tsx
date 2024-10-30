import React, { useState, useEffect } from "react";

import BottomNavigation from "./bottom_navigation";
import ConferenceQuestion from "./conference_question";
import ForecastOverview from "./forecast_overview";
import { fetchPosts } from "@/app/(main)/questions/actions";
import { PostStatus } from "@/types/post";

export enum ConferenceMode {
  Question = "question",
  Overview = "overview",
}

interface QuestionManagerProps {
  slug: string;
}

const QuestionManager: React.FC<QuestionManagerProps> = ({ slug }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [mode, setMode] = useState<ConferenceMode>(ConferenceMode.Question);
  const [questionIds, setQuestionIds] = useState<number[]>([]);

  useEffect(() => {
    const fetchQuestionIds = async () => {
      try {
        const { questions } = await fetchPosts(
          {
            tournaments: slug,
            statuses: PostStatus.APPROVED,
          },
          0,
          100
        );
        setQuestionIds(questions.map(q => q.id));
      } catch (error) {
        console.error("Failed to fetch question IDs:", error);
        setQuestionIds([]);
      }
    };

    fetchQuestionIds();
  }, [slug]); // Updated dependency array

  return (
    <div className="flex flex-col items-center justify-between">
      <div className="w-full flex-grow">
        <div className="flex min-h-full items-center justify-center p-4">
          {mode === ConferenceMode.Question ? (
            <ConferenceQuestion
              questionId={questionIds[currentQuestionIndex]}
            />
          ) : (
            <ForecastOverview questionIds={questionIds} />
          )}
        </div>
      </div>
      <BottomNavigation
        currentQuestionIndex={currentQuestionIndex}
        setCurrentQuestionIndex={setCurrentQuestionIndex}
        questionIds={questionIds}
        mode={mode}
        setMode={setMode}
        tournamentSlug={slug}  // Updated to use slug prop
      />
    </div>
  );
};

export default QuestionManager;
