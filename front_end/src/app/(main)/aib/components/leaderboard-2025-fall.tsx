import { faArrowRight, faTrophy } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useTranslations } from "next-intl";

import Button from "@/components/ui/button";

function FallBotLeaderboard2025() {
  const t = useTranslations();

  return (
    <Link
      href="/tournament/fall-aib-2025/"
      className="group flex size-full max-h-[420px] min-h-[300px] flex-col items-center justify-center gap-2 overflow-y-auto rounded bg-white p-3 no-underline transition-all hover:bg-blue-200/50 dark:bg-blue-100-dark dark:hover:bg-blue-200-dark md:gap-4 md:p-6 min-[1920px]:max-h-[680px]"
    >
      <FontAwesomeIcon
        icon={faTrophy}
        className="text-4xl opacity-20 transition-all group-hover:opacity-80 md:text-6xl xl:text-8xl"
      />
      <p className="m-0 text-center text-lg text-blue-700 dark:text-blue-700-dark md:text-2xl">
        {t("FABViewLeaderboardAndQuestions")}
      </p>
      <Button
        size="lg"
        variant="secondary"
        className="mb-3 mt-2 gap-2 opacity-70 transition-all group-hover:opacity-100 md:mb-0 lg:mt-4"
      >
        {t("FABViewTournament")}
        <FontAwesomeIcon icon={faArrowRight} />
      </Button>
    </Link>
  );
}

export default FallBotLeaderboard2025;
