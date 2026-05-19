import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export async function HubCtaCard() {
  const t = await getTranslations();
  return (
    <Link
      href="/labor-hub/"
      className="group flex items-center justify-between gap-4 rounded-lg bg-blue-200 px-5 py-5 text-blue-900 transition-colors hover:bg-blue-300 dark:bg-blue-200-dark dark:text-blue-900-dark dark:hover:bg-blue-300-dark sm:px-6 sm:py-6"
    >
      <span className="flex flex-col">
        <strong className="text-base font-bold leading-tight sm:text-lg">
          {t("laborHubJobsExploreCta")}
        </strong>
        <span className="mt-1 text-sm text-blue-700 dark:text-blue-700-dark">
          {t("laborHubJobsExploreCtaSub")}
        </span>
      </span>
      <span
        aria-hidden="true"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-700 text-gray-0 transition-transform group-hover:translate-x-1 dark:bg-blue-700-dark dark:text-gray-0-dark"
      >
        <FontAwesomeIcon icon={faArrowRight} />
      </span>
    </Link>
  );
}
