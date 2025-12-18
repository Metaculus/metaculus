import { Metadata } from "next";
import dynamic from "next/dynamic";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { FC, PropsWithChildren } from "react";
import { remark } from "remark";
import strip from "strip-markdown";

import UserInfo from "@/app/(main)/accounts/profile/components/user_info";
import Button from "@/components/ui/button";
import { defaultDescription } from "@/constants/metadata";
import ServerProfileApi from "@/services/api/profile/profile.server";
import { UserProfile } from "@/types/users";
import cn from "@/utils/core/cn";

const SoftDeleteButton = dynamic(
  () => import("../components/soft_delete_button")
);

type Props = {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const profile = await ServerProfileApi.getProfileById(+params.id);

  if (!profile) {
    return {};
  }
  const parsedBio = String(remark().use(strip).processSync(profile.bio));

  return {
    title: `${profile.username}'s profile | Metaculus`,
    description: !!parsedBio ? parsedBio : defaultDescription,
  };
}

export default async function ProfileLayout(props: Props) {
  const params = await props.params;
  const id = +params.id;
  const { children } = props;

  const currentUser = await ServerProfileApi.getMyProfile();
  const isCurrentUser = currentUser?.id === id;

  let profile: UserProfile = await ServerProfileApi.getProfileById(id);

  if (!profile) {
    return notFound();
  }

  if (isCurrentUser) {
    profile = {
      ...profile,
      ...currentUser,
    };
  }

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
            {profile.spam_count && currentUser?.is_staff ? (
              <Link
                href={`/admin/users/userspamactivity/?q=${profile.username}`}
              >
                <ProfileChip variant="danger">
                  {profile.spam_count} spam warnings
                </ProfileChip>
              </Link>
            ) : null}
          </div>
        </div>
      )}

      <UserInfo profile={profile} isCurrentUser={isCurrentUser} />

      {children}
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
