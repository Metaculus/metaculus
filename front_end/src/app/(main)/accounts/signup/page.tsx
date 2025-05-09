import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import ServerProfileApi from "@/services/api/profile/profile.server";

import SignUp from "./components/signup";

export default async function SignupPage() {
  const t = await getTranslations();
  const user = await ServerProfileApi.getMyProfile();

  if (user) {
    return redirect("/");
  }

  return (
    <div className="mb-4 mt-2 flex w-fit max-w-4xl flex-col justify-center self-center rounded-none bg-gray-0 px-4 pb-5 pt-4 text-gray-800 dark:bg-gray-0-dark dark:text-gray-800-dark md:m-8 md:mx-auto md:rounded-md md:px-8 md:pb-8 lg:m-12 lg:mx-auto">
      <div className="text-sm md:text-base">
        <h1 className="font-medium capitalize">
          {t("registrationHeadingSite")}
        </h1>
        <div className="mt-12">
          <SignUp />
        </div>
      </div>
    </div>
  );
}
