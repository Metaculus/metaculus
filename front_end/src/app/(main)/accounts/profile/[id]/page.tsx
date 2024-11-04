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
import { ProfilePageMode } from "@/types/users";
import ProfilePageTab from "./components/profile_page_tab";

export default async function Profile({
  params: { id },
  searchParams,
}: {
  params: { id: number };
  searchParams: SearchParams;
}) {
  const currentUser = await ProfileApi.getMyProfile();
  const isCurrentUser = currentUser?.id === +id;

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

  const mode = (searchParams.mode || "overview") as ProfilePageMode;

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
        </div>
        <div className="flex flex-row text-xs font-medium md:text-sm">
          <ProfilePageTab id={id} mode={mode} />
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
          <CommentFeed profileId={profile.id} rootCommentStructure={false} />
        </div>
      )}
    </main>
  );
}
