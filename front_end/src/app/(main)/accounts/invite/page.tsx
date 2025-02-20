import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import InviteForm from "@/app/(main)/accounts/invite/components/invite_form";
import ProfileApi from "@/services/profile";

export default async function SignupPage() {
  const t = await getTranslations();
  const user = await ProfileApi.getMyProfile();

  if (!user?.is_staff) {
    return redirect("/");
  }

  return (
    <div className="mb-4 mt-2 flex w-fit max-w-4xl flex-col justify-center self-center rounded-none bg-gray-0 px-4 pb-5 pt-4 text-gray-800 dark:bg-gray-0-dark dark:text-gray-800-dark md:m-8 md:mx-auto md:rounded-md md:px-8 md:pb-8 lg:m-12 lg:mx-auto">
      <div className="text-sm md:text-base">
        <h1 className="font-medium capitalize">{t("signupInviteUsers")}</h1>
        <p>{t("signupInviteUsersDescription")}</p>
        <InviteForm />
      </div>
    </div>
  );
}
