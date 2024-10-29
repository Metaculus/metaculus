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
  handleNavigation: (direction: 'forward' | 'previous' | 'back') => void;
}

const BottomNavigation = ({
  currentQuestionIndex,
  setCurrentQuestionIndex,
  questionIds,
  mode,
  setMode,
  tournamentId,
  handleNavigation,
}: BottomNavigationProps) => {
  const isLastQuestion = currentQuestionIndex === questionIds.length - 1;

  return (
    <div className="mt-8 flex w-full items-center justify-between px-4 pb-4">
      {mode === ConferenceMode.Question && (
        <>
          <Button
            onClick={() => handleNavigation('previous')}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </Button>
          <span className="text-lg">
            {currentQuestionIndex + 1} / {questionIds.length}
          </span>
          {isLastQuestion ? (
            <Button onClick={() => handleNavigation('forward')}>
              Finish
            </Button>
          ) : (
            <Button onClick={() => handleNavigation('forward')}>
              Next
            </Button>
          )}
        </>
      )}
      {mode === ConferenceMode.Overview && (
        <>
          <Button onClick={() => handleNavigation('back')}>
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
