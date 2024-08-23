import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import MedalsPage from "@/app/(main)/(leaderboards)/medals/components/medals_page";
import MedalsWidget from "@/app/(main)/(leaderboards)/medals/components/medals_widget";
import UserInfo from "@/app/(main)/accounts/profile/components/user_info";
import CommentFeed from "@/components/comment_feed";
import LoadingIndicator from "@/components/ui/loading_indicator";
import ProfileApi from "@/services/profile";
import { SearchParams } from "@/types/navigation";

import ChangeUsername from "../components/change_username";
import TrackRecord from "../components/track_record";

export default async function Profile({
  params: { id },
  searchParams,
}: {
  params: { id: number };
  searchParams: SearchParams;
}) {
  const currentUser = await ProfileApi.getMyProfile();
  const isCurrentUser = currentUser?.id === +id;
  const t = await getTranslations();

  let profile = await ProfileApi.getProfileById(id);

  if (!profile) {
    return notFound();
  }

  if (isCurrentUser) {
    profile = {
      ...profile,
      ...currentUser,
    };
  }
  const mode = searchParams.mode || "overview";
  return (
    <main className="mx-auto my-4 flex min-h-min w-full max-w-5xl flex-col gap-4 px-3 lg:px-0">
      <div className="flex flex-col gap-4 rounded bg-white p-4 dark:bg-blue-900 md:p-6">
        <div className="flex flex-col">
          <h1 className="mt-0 inline text-3xl md:text-4xl">
            {profile.username}
          </h1>
          {isCurrentUser && (
            <span className="inline">
              <ChangeUsername />
            </span>
          )}
          <span className="text-base font-light text-gray-500 md:text-lg">
            {profile.first_name} {profile.last_name}
          </span>
        </div>
        <div className="flex flex-row text-xs font-medium md:text-sm">
          <Link href={`/accounts/profile/${id}?mode=overview`}>
            <button
              dir="ltr"
              className={
                "m-0 h-full rounded-s-3xl border border-e-0 px-2 py-1.5 font-light dark:border-blue-950 max-[340px]:px-2 md:px-3 md:py-2 " +
                (mode === "overview"
                  ? " bg-blue-900 text-white hover:bg-blue-800 dark:bg-blue-100 dark:text-blue-900 dark:hover:bg-blue-200 "
                  : " bg-blue-100 hover:bg-blue-200 dark:bg-blue-950 hover:dark:bg-blue-800 ")
              }
            >
              {t("overview")}
            </button>
          </Link>
          <Link href={`/accounts/profile/${id}?mode=track_record`}>
            <button
              className={
                "m-0 h-full border px-3 py-2 font-light dark:border-blue-950  max-[340px]:w-min max-[340px]:px-2 md:w-fit " +
                (mode === "track_record"
                  ? " bg-blue-900 text-white hover:bg-blue-800 dark:bg-blue-100 dark:text-blue-900 dark:hover:bg-blue-200 "
                  : " bg-white hover:bg-blue-200 dark:bg-blue-950 hover:dark:bg-blue-800")
              }
            >
              {t("trackRecord")}
            </button>
          </Link>
          <Link href={`/accounts/profile/${id}?mode=medals`}>
            <button
              className={
                "m-0 h-full border border-s-0 px-3 py-2  font-light dark:border-blue-950 max-[340px]:px-2 " +
                (mode === "medals"
                  ? " bg-blue-900 text-white hover:bg-blue-800 dark:bg-blue-100 dark:text-blue-900 dark:hover:bg-blue-200 "
                  : " bg-white hover:bg-blue-200 dark:bg-blue-950 hover:dark:bg-blue-800")
              }
            >
              {t("medals")}
            </button>
          </Link>
          <Link href={`/accounts/profile/${id}?mode=comments`}>
            <button
              dir="rtl"
              className={
                "m-0 h-full rounded-s-3xl border border-e-0  px-3 py-2 font-light dark:border-blue-950 max-[340px]:px-2 " +
                (mode === "comments"
                  ? " bg-blue-900 text-white hover:bg-blue-800 dark:bg-blue-100 dark:text-blue-900 dark:hover:bg-blue-200 "
                  : " bg-white hover:bg-blue-200 dark:bg-blue-950 hover:dark:bg-blue-800")
              }
            >
              {t("comments")}
            </button>
          </Link>
        </div>
      </div>
      {mode === "overview" && (
        <div className="flex flex-col gap-4 rounded">
          <UserInfo
            profile={profile}
            isCurrentUser={isCurrentUser}
            MedalsComponent={
              <Suspense
                fallback={<LoadingIndicator className="mx-auto my-8 w-24" />}
              >
                <MedalsWidget profileId={profile.id} />
              </Suspense>
            }
          />
        </div>
      )}
      {mode === "track_record" && <TrackRecord profile={profile} />}
      {mode === "medals" && (
        <div>
          <MedalsPage profileId={profile.id} />
        </div>
      )}
      {mode === "comments" && (
        <div className="flex flex-col rounded bg-white px-4 py-1 dark:bg-blue-900 md:px-6 md:py-2">
          <CommentFeed profileId={profile.id} />
        </div>
      )}
    </main>
  );
}
