import { faTrophy } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";

declare global {
  interface Window {
    metacBWPageData: {
      isUserRegistered: boolean;
      tournamentURL: string | null;
      practiceProjectURL: string | null;
      userEmail: string | null;
    };
  }
}

function Announcement() {
  return (
    <div className="flex w-full flex-col md:flex-row">
      <div className="flex w-full flex-row items-center justify-center rounded bg-purple-500/40 p-4 dark:bg-purple-500-dark/40">
        <div className="text-base leading-normal text-purple-800 dark:text-purple-800-dark md:text-lg">
          <FontAwesomeIcon
            icon={faTrophy}
            className="mr-3 text-base text-purple-800/70 dark:text-purple-800-dark/70 md:text-lg"
          />
          Congratulations to the winners! Below are the top 10 forecasters for
          each competition. See the full rankings on the{" "}
          <Link
            className="text-purple-700 hover:text-purple-800 dark:text-purple-700-dark dark:hover:text-purple-800-dark"
            href="/tournament/bridgewater/"
          >
            contest page.
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Announcement;
