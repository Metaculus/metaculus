import Link from "next/link";
import React from "react";

import Button from "@/components/ui/button";

import { ConferenceMode } from "./question_manager";

interface BottomNavigationProps {
  currentQuestionIndex: number;
  setCurrentQuestionIndex: (index: number) => void;
  questionIds: number[];
  mode: ConferenceMode;
  setMode: (mode: ConferenceMode) => void;
  tournamentId: number;
}

const BottomNavigation = ({
  currentQuestionIndex,
  setCurrentQuestionIndex,
  questionIds,
  mode,
  setMode,
  tournamentId,
}: BottomNavigationProps) => {
  const isLastQuestion = currentQuestionIndex === questionIds.length - 1;

  return (
    <div className="mt-8 flex w-full items-center justify-between pb-4">
      {mode === ConferenceMode.Question && (
        <>
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
          {isLastQuestion ? (
            <Button onClick={() => setMode(ConferenceMode.Overview)}>
              Finish
            </Button>
          ) : (
            <Button
              onClick={() =>
                setCurrentQuestionIndex(
                  Math.min(questionIds.length - 1, currentQuestionIndex + 1)
                )
              }
            >
              Next
            </Button>
          )}
        </>
      )}
      {mode === ConferenceMode.Overview && (
        <>
          <Button onClick={() => setMode(ConferenceMode.Question)}>
            Back to Questions
          </Button>
          <Link href={`/tournaments/${tournamentId}`} passHref>
            <Button>See Results</Button>
          </Link>
        </>
      )}
    </div>
  );
};

export default BottomNavigation;
