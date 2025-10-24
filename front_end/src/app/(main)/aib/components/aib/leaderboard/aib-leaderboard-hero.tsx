"use client";

import { faQuestionCircle } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useTranslations } from "next-intl";

const AIBLeaderboardHero: React.FC = () => {
  const t = useTranslations();

  return (
    <div className="mb-6 flex flex-col items-center gap-4 antialiased sm:mb-10">
      <Link
        className="mb-2 text-base font-medium text-blue-700 dark:text-blue-700-dark sm:mb-0 sm:text-lg"
        href="/aib"
      >
        {t("aibLbBrandLink")}
      </Link>

      <h1 className="m-0 text-center text-[32px] font-bold leading-[116%] -tracking-[1.28px] text-blue-800 dark:text-blue-800-dark sm:text-5xl sm:-tracking-[1.92px]">
        {t.rich("aibLbTitle", {
          br: () => <br className="min-[376px]:hidden" />,
        })}
      </h1>

      <div className="flex items-center gap-2 text-sm font-normal text-blue-700 dark:text-blue-700-dark sm:text-xl sm:font-medium">
        <span>{t("aibLbSubtitle")}</span>
        <FontAwesomeIcon
          icon={faQuestionCircle}
          className="h-3 w-3 sm:h-5 sm:w-5"
        />
      </div>
    </div>
  );
};

export default AIBLeaderboardHero;
