import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const FeedbackFloat: React.FC = () => (
  <a
    href="https://github.com/metaculus/metaculus"
    target="_blank"
    rel="noopener noreferrer"
    className="fixed bottom-4 right-4 z-50 flex h-8 w-8 items-center justify-center rounded-full border border border-transparent bg-blue-800 p-2 text-base text-blue-800 text-white no-underline shadow-lg transition-colors hover:bg-blue-900 hover:text-blue-900 active:text-blue-700 disabled:text-blue-800 disabled:opacity-30 dark:text-blue-800-dark dark:hover:text-blue-900-dark dark:active:text-blue-700-dark disabled:dark:text-blue-800-dark"
    aria-label="View on GitHub"
  >
    <FontAwesomeIcon icon={faPaperPlane} />
  </a>
);

export default FeedbackFloat;
