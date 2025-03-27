import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { FC, PropsWithChildren, Suspense } from "react";
import { remark } from "remark";
import strip from "strip-markdown";

import MedalsPage from "@/app/(main)/(leaderboards)/medals/components/medals_page";
import { MedalsWidget } from "@/app/(main)/(leaderboards)/medals/components/medals_widget";
import UserInfo from "@/app/(main)/accounts/profile/components/user_info";
import CalibrationChart from "@/app/(main)/questions/track-record/components/charts/calibration_chart";
import CommentFeed from "@/components/comment_feed";
import AwaitedPostsFeed from "@/components/posts_feed";
import Button from "@/components/ui/button";
import LoadingIndicator from "@/components/ui/loading_indicator";
import { defaultDescription } from "@/constants/metadata";
import { PostsParams } from "@/services/posts";
import ProfileApi from "@/services/profile";
import { SearchParams } from "@/types/navigation";
import { ProfilePageMode, UserProfile } from "@/types/users";
import cn from "@/utils/cn";
import { formatUsername } from "@/utils/users";

import SoftDeleteButton from "../components/soft_delete_button";
import TrackRecord from "../components/track_record";

type Props = {
  params: Promise<{ id: number }>;
  searchParams: Promise<SearchParams>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
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

export default async function Profile(props: Props) {
  const searchParams = await props.searchParams;
  const params = await props.params;

  const { id } = params;

  const currentUser = await ProfileApi.getMyProfile();
  const isCurrentUser = currentUser?.id === +id;

  let profile: UserProfile = await ProfileApi.getProfileById(id);
  const userQuestionsFilters: PostsParams = { usernames: profile.username };

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
            <ProfileChip variant={profile.is_spam ? "danger" : "success"}>
              {profile.is_spam ? "Spam" : "Not Spam"}
            </ProfileChip>
          </div>
        </div>
      )}

      <UserInfo profile={profile} isCurrentUser={isCurrentUser} />

      {mode === ProfilePageMode.Overview && (
        <>
          <MedalsWidget profileId={id} />

          <div className="flex flex-col gap-4 rounded bg-white p-4 dark:bg-blue-900 md:p-6">
            {profile.calibration_curve && (
              <CalibrationChart
                calibrationData={profile.calibration_curve}
                username={formatUsername(profile)}
              />
            )}
          </div>
        </>
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
      {mode === ProfilePageMode.Questions && (
        <div className="flex flex-col gap-6 rounded bg-white p-4 dark:bg-blue-900 md:p-6">
          <h3 className="my-0 py-0 text-gray-700 dark:text-gray-300">
            {t("questionsBy") + " " + formatUsername(profile)}
          </h3>

          <Suspense
            key={JSON.stringify(searchParams)}
            fallback={
              <LoadingIndicator className="mx-auto h-8 w-24 text-gray-600 dark:text-gray-600-dark" />
            }
          >
            <AwaitedPostsFeed filters={userQuestionsFilters} />
          </Suspense>
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
