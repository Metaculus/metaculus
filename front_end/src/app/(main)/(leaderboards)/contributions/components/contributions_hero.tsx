import { faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { FC, PropsWithChildren, Suspense } from "react";

import WithServerComponentErrorBoundary from "@/components/server_component_error_boundary";
import Button from "@/components/ui/button";
import ProfileApi from "@/services/profile";
import { CategoryKey } from "@/types/scoring";
import { formatUsername } from "@/utils/users";

import { getPeriodLabel } from "../../helpers/filters";
import { RANKING_CATEGORIES } from "../../ranking_categories";
import {
  SCORING_CATEGORY_FILTER,
  SCORING_DURATION_FILTER,
  SCORING_YEAR_FILTER,
} from "../../search_params";

type Props = {
  category: CategoryKey;
  duration: string;
  year: string;
  userId: number;
};

const ContributionsHero: FC<Props> = ({ year, duration, category, userId }) => {
  const t = useTranslations();

  return (
    <section className="flex flex-col items-center gap-3.5 self-stretch py-3 sm:gap-7 sm:p-8">
      <div className="flex flex-col gap-4">
        <nav className="flex items-center justify-center gap-2.5 text-base font-medium leading-5">
          <Link href="/leaderboard/">{t("leaderboards")}</Link>
          <FontAwesomeIcon
            icon={faChevronRight}
            className="h-4 w-2.5 text-gray-400 dark:text-gray-400-dark"
          />
          <Link
            href={`/leaderboard/?${SCORING_CATEGORY_FILTER}=${category}&${SCORING_DURATION_FILTER}=${duration}&${SCORING_YEAR_FILTER}=${year}`}
          >
            {category && t(RANKING_CATEGORIES[category].translationKey)}
          </Link>
        </nav>
        <div className="flex items-center justify-center gap-3">
          <Suspense fallback={<UserHeader>{t("user")}</UserHeader>}>
            <AwaitedUserHeader userId={userId} />
          </Suspense>
          <Button variant="primary" href={`/accounts/profile/${userId}`}>
            {t("viewProfile")}
          </Button>
        </div>
      </div>
      <div className="flex gap-5 text-base font-medium leading-6">
        <div className="flex gap-1.5 text-gray-500 dark:text-gray-500-dark">
          <span>{t("duration:")}</span>
          <span className="text-gray-800 dark:text-gray-800-dark">
            {`${duration} ${Number(duration) > 1 ? t("years") : t("year")}`}
          </span>
        </div>
        <div className="flex gap-1.5 text-gray-500 dark:text-gray-500-dark">
          <span>{t("timePeriod")}</span>
          <span className="text-gray-800 dark:text-gray-800-dark">
            {getPeriodLabel(year, duration)}
          </span>
        </div>
      </div>
      <div className="max-w-3xl border-t border-gray-700 pt-3 text-center text-base font-normal leading-6 text-gray-700 dark:border-gray-700-dark dark:text-gray-700-dark sm:px-5 sm:pt-6">
        {RANKING_CATEGORIES[category].explanation}
      </div>
    </section>
  );
};

const AwaitedUserHeader: FC<{ userId: number }> =
  WithServerComponentErrorBoundary(async ({ userId }) => {
    const t = await getTranslations();
    const profile = await ProfileApi.getProfileById(userId);
    const username = formatUsername(profile);

    return <UserHeader>{username ?? t("user")}</UserHeader>;
  });

const UserHeader: FC<PropsWithChildren> = ({ children }) => (
  <h1 className="m-0 text-2xl font-bold text-blue-900 dark:text-blue-900-dark sm:text-4xl">
    {children}
  </h1>
);

export default ContributionsHero;
