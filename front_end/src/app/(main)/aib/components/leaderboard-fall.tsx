import {
  faArrowRight,
  faChartBar,
  faTrophy,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";

import Button from "@/components/ui/button";

function FallBotLeaderboard() {
  return (
    <Link
      href="/tournament/fall-aib-2025/"
      className="group flex size-full max-h-[420px] min-h-[300px] flex-col items-center justify-center gap-4 overflow-y-auto rounded bg-white p-4 no-underline transition-all hover:bg-blue-200/50 dark:bg-blue-100-dark dark:hover:bg-blue-200-dark md:gap-5 min-[1920px]:max-h-[680px] min-[1920px]:gap-8 min-[1920px]:p-12"
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex items-center gap-4">
          <FontAwesomeIcon
            icon={faTrophy}
            className="text-4xl opacity-20 md:text-5xl"
          />
          <FontAwesomeIcon
            icon={faChartBar}
            className="text-4xl opacity-20 md:text-5xl"
          />
        </div>
        <p className="m-0 text-lg text-blue-700 dark:text-blue-700-dark md:text-xl">
            View the leaderboard and questions.
        </p>
        <p className="m-0 text-base text-blue-600 opacity-70 dark:text-blue-600-dark md:text-lg">
            The Fall 2025 Bot Tournament closes January 5th, and will be finalized in March.
        </p>
      </div>
      <Button
        variant="secondary"
        className="mt-2 gap-2 opacity-70 transition-all group-hover:opacity-100"
      >
        View Tournament
        <FontAwesomeIcon icon={faArrowRight} />
      </Button>
    </Link>
  );
}

export default FallBotLeaderboard;
