import { parseISO, format } from "date-fns";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import ChangeUsername from "@/app/accounts/profile/components/change_username";
import Button from "@/components/ui/button";
import Hr from "@/components/ui/hr";
import ProfileApi from "@/services/profile";

export default async function Profile({
  params: { id },
}: {
  params: { id: number };
}) {
  const t = await getTranslations();
  const currentUser = await ProfileApi.getMyProfile();
  const isCurrentUser = currentUser?.id === +id;

  const profile = isCurrentUser
    ? currentUser
    : await ProfileApi.getProfileById(id);

  if (!profile) {
    return notFound();
  }

  return (
    <main className="mx-auto min-h-min w-full max-w-3xl flex-auto rounded bg-white p-0 sm:p-2 sm:pt-0 md:p-3 lg:mt-4">
      <section>
        <Hr />
        <div className="flex items-center justify-between">
          <h2 className="my-4 text-2xl font-bold">{t("profile")}</h2>
          {isCurrentUser && (
            <Button variant="link" href={`/accounts/profile/edit`}>
              Edit
            </Button>
          )}
        </div>
        <div>
          <div className="mb-4 bg-gray-100 p-1 text-sm font-medium leading-4 text-gray-900">
            Username
          </div>
          <div className="flex content-center justify-between px-1">
            <div className="flex items-center text-sm	">{profile.username}</div>
            {isCurrentUser && <ChangeUsername />}
          </div>
        </div>
        <div>
          <div className="my-4 bg-gray-100 p-1 text-sm font-medium leading-4 text-gray-900">
            {t("memberSince")}
          </div>
          <div className="flex content-center justify-between px-1">
            <div className="flex items-center text-sm	">
              <time dateTime={profile.date_joined}>
                {format(parseISO(profile.date_joined), "LLLL d, yyyy")}
              </time>
            </div>
          </div>
        </div>
        <div>
          <div className="my-4 bg-gray-100 p-1 text-sm font-medium leading-4 text-gray-900">
            {t("bio")}
          </div>
          <div className="flex content-center justify-between px-1">
            <div className="flex items-center text-sm	">{profile.bio}</div>
          </div>
        </div>
        <div>
          <div className="my-4 bg-gray-100 p-1 text-sm font-medium leading-4 text-gray-900">
            {t("website")}
          </div>
          <div className="flex content-center justify-between px-1">
            <div className="flex items-center text-sm	">{profile.website}</div>
          </div>
        </div>
      </section>
    </main>
  );
}
