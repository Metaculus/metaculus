"use client";

import { faCommentDots } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { usePostHog } from "posthog-js/react";

const FeedbackFloat: React.FC = () => {
  const posthog = usePostHog();

  return (
    <button
      type="button"
      onClick={() => posthog.capture("feedback_float_clicked")}
      className="fixed bottom-4 right-4 z-100 flex h-8 w-8 items-center justify-center rounded-full border border-transparent bg-blue-800 p-2 text-base text-white no-underline shadow-lg transition-colors hover:bg-blue-900 hover:text-blue-900 active:text-blue-700 disabled:text-blue-800 disabled:opacity-30 dark:text-blue-800-dark dark:hover:text-blue-900-dark dark:active:text-blue-700-dark disabled:dark:text-blue-800-dark"
      aria-label="Get in touch"
      id="feedback-float"
    >
      <FontAwesomeIcon icon={faCommentDots} />
    </button>
  );
};
export default FeedbackFloat;
