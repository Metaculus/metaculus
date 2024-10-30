import classNames from "classnames";
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
  tournamentSlug: string;
}

const BottomNavigation = ({
  currentQuestionIndex,
  setCurrentQuestionIndex,
  questionIds,
  mode,
  setMode,
  tournamentSlug,
}: BottomNavigationProps) => {
  const isLastQuestion = currentQuestionIndex === questionIds.length - 1;

  const renderPageNumbers = () => {
    const totalPages = questionIds.length;
    const currentPage = currentQuestionIndex + 1;
    const pageNumbers = [];

    const addPageNumber = (number: number, isCurrent = false) => (
      <button
        key={number}
        onClick={() => setCurrentQuestionIndex(number - 1)}
        className={classNames(
          "mx-1 rounded-full px-2 py-1 text-sm font-medium",
          isCurrent
            ? "bg-blue-600 text-white dark:bg-blue-400 dark:text-blue-900"
            : "text-gray-600 hover:bg-blue-100 dark:text-gray-400 dark:hover:bg-blue-800"
        )}
      >
        {number}
      </button>
    );

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(addPageNumber(i, i === currentPage));
      }
    } else {
      pageNumbers.push(addPageNumber(1, currentPage === 1));
      if (currentPage > 3) {
        pageNumbers.push(<span key="ellipsis1">...</span>);
      }
      for (
        let i = Math.max(2, currentPage - 1);
        i <= Math.min(totalPages - 1, currentPage + 1);
        i++
      ) {
        pageNumbers.push(addPageNumber(i, i === currentPage));
      }
      if (currentPage < totalPages - 2) {
        pageNumbers.push(<span key="ellipsis2">...</span>);
      }
      pageNumbers.push(addPageNumber(totalPages, currentPage === totalPages));
    }

    return pageNumbers;
  };

  return (
    <div className="mt-8 flex w-full items-center justify-between px-4 pb-4">
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
          <div className="flex items-center">{renderPageNumbers()}</div>
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
          <Link href={`/tournament/${tournamentSlug}`} passHref>
            <Button>See Results</Button>
          </Link>
        </>
      )}
    </div>
  );
};

export default BottomNavigation;
