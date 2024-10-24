"use client";
import React, { useState, useEffect } from "react";

import { getPost } from "@/app/(main)/conference/post-api-actions";

import Button from "@/components/ui/button";
import { useAuth } from "@/contexts/auth_context";
import { useModal } from "@/contexts/modal_context";
import { PostWithForecasts } from "@/types/post";
import { estimateReadingTime, getQuestionTitle } from "@/utils/questions";
// TODO: Overall
// - Refactor this file into muliple components for cleanliness
// - Clean the code up
// - Clean up any UI/UX eyesores
//   - If mobile is being used
//     - change header.tsx links to not have Tournaments in the main links (since on mobile it overflows)
//     - Make the "threshold 2030" wrap in a way that centers itself

// TODO: ConferencePage
// - Login allows someone to login (reuses existing login)
// - Does not show login button if already logged in, but instead shows 'start' button
// - Consider updating 'conference' in cs.json, es.json, and zh.json (are we supporting multiple languages)
// - test login
// - Add translation to all the words (t = useTranslation())if being used in the international UI (including the 'conference' header)
// - Test making a new account

// TODO: Question Component
// - Figure out if continuous or MC questions will be asked

export default function ConferencePage() {
  const { setCurrentModal } = useModal();
  const { user } = useAuth();
  const handleLogin = () => {
    setCurrentModal({ type: "signin" });
  };
  return (
    <>
      {!user ? (
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
          <h1 className="mb-16 text-4xl font-bold">
            Welcome to Threshold 2030
          </h1>
          <div className="w-full max-w-sm space-y-4">
            <Button
              className="w-full"
              variant="secondary"
              onClick={handleLogin}
            >
              Login/Signup to Begin
            </Button>
          </div>
        </div>
      ) : (
        <QuestionManager />
      )}
    </>
  );
}

const QuestionManager = () => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const questionIds = [11589, 27902, 28072, 18546];
  return (
    <div className="flex h-[70vh] flex-col items-center justify-between p-4">
      <div className="flex flex-grow items-center justify-center">
        <ConferenceQuestion questionId={questionIds[currentQuestionIndex]} />
      </div>
      <BottomNavigation
        currentQuestionIndex={currentQuestionIndex}
        setCurrentQuestionIndex={setCurrentQuestionIndex}
        questionIds={questionIds}
      />
    </div>
  );
};

const ConferenceQuestion = ({ questionId }: { questionId: number }) => {
  const [question, setQuestion] = useState<PostWithForecasts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
    </div>
  );
};

const BottomNavigation = ({
  currentQuestionIndex,
  setCurrentQuestionIndex,
  questionIds,
}: {
  currentQuestionIndex: number;
  setCurrentQuestionIndex: (index: number) => void;
  questionIds: number[];
}) => {
  return (
    <div className="mt-8 flex w-full items-center justify-between pb-4">
      <Button
        onClick={() =>
          setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))
        }
        disabled={currentQuestionIndex === 0}
      >
        Previous
      </Button>
      <span className="text-lg">
        {currentQuestionIndex + 1} / {questionIds.length}
      </span>
      <Button
        onClick={() =>
          setCurrentQuestionIndex(
            Math.min(questionIds.length - 1, currentQuestionIndex + 1)
          )
        }
        disabled={currentQuestionIndex === questionIds.length - 1}
      >
        Next
      </Button>
    </div>
  );
};
