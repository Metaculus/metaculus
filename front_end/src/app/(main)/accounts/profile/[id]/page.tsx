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
    <main className="mx-auto mt-4 min-h-min w-full max-w-3xl flex-auto rounded bg-gray-200 p-0 p-4 dark:bg-gray-200-dark">
      <div className="m-4 flex flex-col rounded bg-gray-0 p-0 p-4 dark:bg-gray-0-dark">
        <h1 className="text-2xl">{profile.username}</h1>
        <h2 className="mb-4 mt-1 text-lg font-light text-gray-200">
          {profile.first_name} {profile.last_name}
        </h2>
        <div className="mb-4 text-xs">
          <Link href={`/accounts/profile/${id}?mode=overview`}>
            <button
              dir="ltr"
              className={
                "m-0 rounded-s-3xl border p-2 font-light hover:bg-gray-400 " +
                (mode === "overview" ? "bg-gray-400" : "")
              }
            >
              {t("overview")}
            </button>
          </Link>
          <Link href={`/accounts/profile/${id}?mode=track_record`}>
            <button
              className={
                "m-0 border p-2 font-light hover:bg-gray-400 " +
                (mode === "track_record" ? "bg-gray-400" : "")
              }
            >
              {t("Track Record")}
            </button>
          </Link>
          <Link href={`/accounts/profile/${id}?mode=comments`}>
            <button
              dir="rtl"
              className={
                "m-0 rounded-s-3xl border p-2 font-light hover:bg-gray-400 " +
                (mode === "comments" ? "bg-gray-400" : "")
              }
            >
              {t("comments")}
            </button>
          </Link>
        </div>
      </div>
      {mode === "overview" && (
        <div className="m-4 flex flex-col rounded bg-gray-0 p-0 p-4 dark:bg-gray-0-dark">
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
        <div className="m-4 flex flex-col rounded bg-gray-0 p-0 p-4 dark:bg-gray-0-dark">
          <CommentFeed profileId={profile.id} />
        </div>
      )}
    </main>
  );
}
