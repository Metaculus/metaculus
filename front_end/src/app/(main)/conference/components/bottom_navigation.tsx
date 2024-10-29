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
  questionIds,
  mode,
  tournamentId,
  handleNavigation,
}: BottomNavigationProps) => {
  const isLastQuestion = currentQuestionIndex === questionIds.length - 1;

  return (
    <div className="mt-2 flex w-full max-w-[800px] items-center justify-between px-4 mt-4 pb-6 mx-auto">
      {mode === ConferenceMode.Question && (
        <>
          <Button
            onClick={() => handleNavigation('previous')}
            disabled={currentQuestionIndex === 0}
            size="lg"
            className="min-w-[120px]"
          >
            Previous
          </Button>
          <span className="text-xl">
            {currentQuestionIndex + 1} / {questionIds.length}
          </span>
          {isLastQuestion ? (
            <Button 
              onClick={() => handleNavigation('forward')}
              size="lg"
              className="min-w-[120px]"
            >
              Finish
            </Button>
          ) : (
            <Button 
              onClick={() => handleNavigation('forward')}
              size="lg"
              className="min-w-[120px]"
            >
              Next
            </Button>
          )}
        </>
      )}
      {mode === ConferenceMode.Overview && (
        <>
          <Button 
            onClick={() => handleNavigation('back')}
            size="lg"
            className="min-w-[120px]"
          >
            Back to Questions
          </Button>
          <Link href={`/tournaments/${tournamentId}`} passHref>
            <Button size="lg" className="min-w-[120px]">
              See Results
            </Button>
          </Link>
        </>
      )}
    </div>
  );
};

export default BottomNavigation;