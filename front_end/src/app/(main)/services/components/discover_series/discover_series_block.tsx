import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useTranslations } from "next-intl";

import cn from "@/utils/core/cn";

import { DISCOVER_SERIES_CARDS } from "./constants";
import SectionHeading from "../section_heading";

const DiscoverServicesBlock: React.FC = () => {
  const t = useTranslations();

  return (
    <>
      <SectionHeading
        title={t("discoverServicesTitle")}
        subtitle={t("discoverServicesSubtitle")}
      />

      <div className="mb-12 mt-8 grid gap-4 antialiased sm:grid-cols-2 sm:gap-6 lg:mb-32 lg:grid-cols-4">
        {DISCOVER_SERIES_CARDS.map((card) => (
          <Link
            key={card.type}
            href={`/services/quiz?category=${encodeURIComponent(card.type)}`}
            className={cn(
              "rounded-lg bg-blue-100 p-4 no-underline dark:bg-blue-100-dark",
              "focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-400-dark",
              "transition-colors duration-200 hover:bg-blue-500/20 dark:hover:bg-blue-500-dark/20"
            )}
          >
            <div className="flex items-start justify-between gap-4 text-blue-700 dark:text-blue-700-dark">
              <FontAwesomeIcon icon={card.icon} className="h-5 w-5" />
              <FontAwesomeIcon icon={faArrowRight} className="h-5 w-5" />
            </div>

            <h3 className="m-0 mt-4 text-base font-bold text-blue-800 dark:text-blue-800-dark">
              {t(card.titleKey)}
            </h3>
            <p className="m-0 mt-3 text-sm font-medium text-blue-700 dark:text-blue-700-dark">
              {t(card.descriptionKey)}
            </p>
          </Link>
        ))}
      </div>
    </>
  );
};

export default DiscoverServicesBlock;
