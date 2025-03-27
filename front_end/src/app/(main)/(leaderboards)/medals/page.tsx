import Link from "next/link";
import { getTranslations } from "next-intl/server";
import invariant from "ts-invariant";

import MedalCategories from "@/app/(main)/(leaderboards)/medals/components/medal_categories";
import Button from "@/components/ui/button";
import LeaderboardApi from "@/services/leaderboard";
import ProfileApi from "@/services/profile";
import { SearchParams } from "@/types/navigation";
import { MedalsPath } from "@/types/scoring";
import { formatUsername } from "@/utils/users";

import { MEDALS_PATH_FILTER, MEDALS_USER_FILTER } from "./search_params";

export default async function Medals(props: {
  searchParams: Promise<SearchParams>;
}) {
  const searchParams = await props.searchParams;

  let userId: number | null;
  if (
    searchParams[MEDALS_USER_FILTER] &&
    !isNaN(Number(searchParams[MEDALS_USER_FILTER]))
  ) {
    userId = Number(searchParams[MEDALS_USER_FILTER]);
  } else {
    const profile = await ProfileApi.getMyProfile();
    userId = profile?.id ?? null;
  }
  invariant(userId, "User id is required");

  const t = await getTranslations();

  const path =
    (searchParams[MEDALS_PATH_FILTER] as MedalsPath | null) ??
    MedalsPath.Profile;

  const userMedals = await LeaderboardApi.getUserMedals(userId);
  const user = userMedals.at(0)?.user;
  const username = user ? formatUsername(user) : undefined;

  return (
    <main className="mb-auto pb-3 text-blue-700 dark:text-blue-700-dark sm:px-3">
      <section className="flex flex-col items-center gap-3 self-stretch px-8 pt-3 sm:pb-4 sm:pt-8">
        {path === MedalsPath.Profile && (
          <Link href={`/accounts/profile/${userId}`}>
            {username
              ? t("userProfile", { username })
              : t("unknownUserProfile")}
          </Link>
        )}
        {path === MedalsPath.Leaderboard && (
          <Link href={"/leaderboard"}>{t("leaderboard")}</Link>
        )}
        <div className="flex flex-col items-center justify-center gap-3">
          <h1 className="m-0 text-2xl font-bold text-blue-900 dark:text-blue-900-dark sm:text-4xl">
            {path !== MedalsPath.Profile
              ? username
                ? t("userMedals", { username })
                : t("unknownUserMedals")
              : t("medals")}
          </h1>
          {path !== MedalsPath.Profile && (
            <Button
              href={`/accounts/profile/${userId}`}
              size="sm"
              variant="primary"
            >
              {t("viewProfile")}
            </Button>
          )}
        </div>
      </section>

      <hr className="m-5 border-t border-gray-300 dark:border-gray-300-dark sm:m-6" />

      <MedalCategories medalEntries={userMedals} userId={userId} />
    </main>
  );
}
