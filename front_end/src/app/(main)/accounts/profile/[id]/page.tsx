import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { remark } from "remark";
import strip from "strip-markdown";

import MedalsPage from "@/app/(main)/(leaderboards)/medals/components/medals_page";
import MedalsWidget from "@/app/(main)/(leaderboards)/medals/components/medals_widget";
import UserInfo from "@/app/(main)/accounts/profile/components/user_info";
import { defaultDescription } from "@/app/(main)/layout";
import CommentFeed from "@/components/comment_feed";
import LoadingIndicator from "@/components/ui/loading_indicator";
import ProfileApi from "@/services/profile";
import { SearchParams } from "@/types/navigation";
import { ProfilePageMode } from "@/types/users";

import ProfilePageTabs from "./components/profile_page_tab";
import ChangeUsername from "../components/change_username";
import TrackRecord from "../components/track_record";

type Props = {
  params: { id: number };
  searchParams: SearchParams;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  let profile = await ProfileApi.getProfileById(params.id);

  if (!profile) {
    return {};
  }
  const parsedBio = String(remark().use(strip).processSync(profile.bio));

  return {
    title: `${profile.username}'s profile | Metaculus`,
    description: !!parsedBio ? parsedBio : defaultDescription,
  };
}

export default async function Profile({ params: { id }, searchParams }: Props) {
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

  const mode = (searchParams.mode ||
    ProfilePageMode.Overview) as ProfilePageMode;

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
          <ProfilePageTabs id={id} mode={mode} />
        </div>
      </div>
      {mode === ProfilePageMode.Overview && (
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
      {mode === ProfilePageMode.TrackRecord && (
        <TrackRecord profile={profile} />
      )}
      {mode === ProfilePageMode.Medals && (
        <div>
          <MedalsPage profileId={profile.id} />
        </div>
      )}
      {mode === ProfilePageMode.Comments && (
        <div className="flex flex-col rounded bg-white px-4 py-1 dark:bg-blue-900 md:px-6 md:py-2">
          <CommentFeed profileId={profile.id} rootCommentStructure={false} />
        </div>
      )}
    </main>
  );
}
