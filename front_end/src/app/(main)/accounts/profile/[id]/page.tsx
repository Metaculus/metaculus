import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { FC, PropsWithChildren, Suspense } from "react";
import { remark } from "remark";
import strip from "strip-markdown";

import MedalsPage from "@/app/(main)/(leaderboards)/medals/components/medals_page";
import MedalsWidget from "@/app/(main)/(leaderboards)/medals/components/medals_widget";
import UserInfo from "@/app/(main)/accounts/profile/components/user_info";
import CommentFeed from "@/components/comment_feed";
import Button from "@/components/ui/button";
import LoadingIndicator from "@/components/ui/loading_indicator";
import { defaultDescription } from "@/constants/metadata";
import ProfileApi from "@/services/profile";
import { SearchParams } from "@/types/navigation";
import { ProfilePageMode } from "@/types/users";
import cn from "@/utils/cn";

import ProfilePageTabs from "./components/profile_page_tab";
import ChangeUsername from "../components/change_username";
import SoftDeleteButton from "../components/soft_delete_button";
import TrackRecord from "../components/track_record";

type Props = {
  params: { id: number };
  searchParams: SearchParams;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const profile = await ProfileApi.getProfileById(params.id);

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

  const t = await getTranslations();

  return (
    <main className="mx-auto my-4 flex min-h-min w-full max-w-5xl flex-col gap-4 px-3 lg:px-0">
      <div className="flex flex-col gap-4 rounded bg-white p-4 dark:bg-blue-900 md:p-6">
        <div className="flex flex-col">
          <h1 className="mt-0 inline text-3xl md:text-4xl">
            {profile.username}
            {profile.is_bot && " 🤖"}
          </h1>
          {isCurrentUser && (
            <span className="inline">
              <ChangeUsername />
            </span>
          )}
          {(currentUser?.is_staff || currentUser?.is_superuser) && (
            <div className="mt-2 flex flex-col gap-3 text-sm md:flex-row">
              <div className="flex flex-wrap items-center gap-3">
                {currentUser.is_superuser && (
                  <Button
                    href={`/admin/users/user/${profile.id}/change/`}
                    target="_blank"
                  >
                    {t("viewInDjangoAdmin")}
                  </Button>
                )}
                {!profile.is_spam && currentUser.is_staff && (
                  <SoftDeleteButton id={id} />
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <ProfileChip variant={profile.is_active ? "success" : "danger"}>
                  {profile.is_active ? "Active" : "Inactive"}
                </ProfileChip>
                {profile.is_spam && (
                  <ProfileChip variant="danger">Spam</ProfileChip>
                )}
              </div>
            </div>
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

const ProfileChip: FC<
  PropsWithChildren<{ variant?: "success" | "danger" }>
> = ({ variant = "success", children }) => (
  <span
    className={cn("rounded px-2 py-1 dark:bg-opacity-20", {
      "dark:bg-green-100-dark bg-green-100 text-green-800 dark:text-green-800-dark":
        variant === "success",
      "dark:bg-red-100-dark dark:text-red-800-dark bg-red-100 text-red-800":
        variant === "danger",
    })}
  >
    {children}
  </span>
);
