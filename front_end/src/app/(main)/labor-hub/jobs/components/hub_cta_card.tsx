import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export async function HubCtaCard() {
  const t = await getTranslations();
  return (
    <Link
      href="/labor-hub/"
      className="group flex items-center justify-between gap-4 rounded-md bg-gray-0 px-6 py-5 text-blue-700 no-underline transition-colors hover:bg-blue-100 dark:bg-gray-0-dark dark:text-blue-700-dark dark:hover:bg-blue-100-dark sm:px-9 sm:py-6"
    >
      <span className="flex flex-col">
        <strong className="text-base font-bold leading-tight text-blue-900 dark:text-blue-900-dark sm:text-lg">
          {t("laborHubJobsExploreCta")}
        </strong>
        <span className="mt-1 text-[13px] text-blue-700 dark:text-blue-700-dark">
          {t("laborHubJobsExploreCtaSub")}
        </span>
      </span>
      <span
        aria-hidden="true"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-700 text-[18px] font-semibold text-gray-0 transition-[transform,background-color] duration-150 group-hover:translate-x-1 group-hover:bg-blue-800 dark:bg-blue-700-dark dark:text-gray-0-dark dark:group-hover:bg-blue-800-dark"
      >
        <FontAwesomeIcon icon={faArrowRight} />
      </span>
    </Link>
  );
}
