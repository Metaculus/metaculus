import { faQuestionCircle } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";

const AIBLeaderboardHero: React.FC = () => {
  return (
    <div className="mb-10 flex flex-col items-center gap-4 antialiased">
      <Link
        className="text-lg font-medium text-blue-700 dark:text-blue-700-dark"
        href="/aib"
      >
        Metaculus FutureEval
      </Link>

      <h1 className="m-0  text-5xl font-bold leading-[116%] -tracking-[1.92px] text-blue-800 dark:text-blue-800-dark">
        Top Model Leaderboards
      </h1>

      <div className="flex items-center gap-2 text-xl font-medium text-blue-700 dark:text-blue-700-dark">
        <span>by Average Baseline Score</span>{" "}
        <FontAwesomeIcon icon={faQuestionCircle} className="h-5 w-5" />
      </div>
    </div>
  );
};

export default AIBLeaderboardHero;
