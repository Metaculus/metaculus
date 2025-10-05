"use client";

import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { useModal } from "@/contexts/modal_context";

const FeedbackFloat: React.FC = () => {
  const { setCurrentModal } = useModal();
  return (
    <button
      type="button"
      onClick={() => setCurrentModal({ type: "contactUs" })}
      className="fixed bottom-4 right-4 z-100 flex h-8 w-8 items-center justify-center rounded-full border border-transparent bg-blue-800 p-2 text-base text-white no-underline shadow-lg transition-colors hover:bg-blue-900 hover:text-blue-900 active:text-blue-700 disabled:text-blue-800 disabled:opacity-30 dark:text-blue-800-dark dark:hover:text-blue-900-dark dark:active:text-blue-700-dark disabled:dark:text-blue-800-dark"
      aria-label="Get in touch"
    >
      <FontAwesomeIcon icon={faPaperPlane} />
    </button>
  );
};
export default FeedbackFloat;
