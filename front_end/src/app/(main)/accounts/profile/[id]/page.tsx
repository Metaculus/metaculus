import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

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

  const profile = isCurrentUser
    ? currentUser
    : await ProfileApi.getProfileById(id);

  if (!profile) {
    return notFound();
  }
  const mode = searchParams.mode || "overview";
  return (
    <main className="mx-auto my-4 flex min-h-min w-full max-w-5xl flex-col gap-4 px-3 lg:px-0">
      <div className="flex flex-col gap-4 rounded bg-white p-6 dark:bg-blue-900">
        <div className="flex flex-col">
          <h1 className="mt-0 inline text-4xl">{profile.username}</h1>
          {isCurrentUser && (
            <span className="inline">
              <ChangeUsername />
            </span>
          )}
          <span className="text-lg font-light text-gray-500">
            {profile.first_name} {profile.last_name}
          </span>
        </div>
        <div className="flex flex-row text-sm font-medium">
          <Link href={`/accounts/profile/${id}?mode=overview`}>
            <button
              dir="ltr"
              className={
                "m-0 rounded-s-3xl border border-e-0 px-3 py-2 font-light dark:border-blue-950 " +
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
                "m-0 border px-3 py-2 font-light dark:border-blue-950 " +
                (mode === "track_record"
                  ? " bg-blue-900 text-white hover:bg-blue-800 dark:bg-blue-100 dark:text-blue-900 dark:hover:bg-blue-200 "
                  : " bg-white hover:bg-blue-200 dark:bg-blue-950 hover:dark:bg-blue-800")
              }
            >
              {t("Track Record")}
            </button>
          </Link>
          <Link href={`/accounts/profile/${id}?mode=comments`}>
            <button
              dir="rtl"
              className={
                "m-0 rounded-s-3xl border border-e-0 px-3 py-2 font-light dark:border-blue-950 " +
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
      {mode === "comments" && (
        <div className="flex flex-col rounded bg-white">
          <CommentFeed profileId={profile.id} />
        </div>
      )}
    </main>
  );
}
