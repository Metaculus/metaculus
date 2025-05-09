import { getTranslations } from "next-intl/server";

import ServerProfileApi from "@/services/api/profile/profile.server";

import RegisterMessage from "./components/register_message";

export default async function CreateQuestionLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const t = await getTranslations();
  const user = await ServerProfileApi.getMyProfile();

  if (!user) {
    return (
      <div className="mb-4 mt-2 flex max-w-4xl flex-col justify-center self-center rounded-none bg-gray-0 px-4 pb-5 pt-4 text-gray-800 dark:bg-gray-0-dark dark:text-gray-800-dark md:m-8 md:mx-auto md:rounded-md md:px-8 md:pb-8 lg:m-12 lg:mx-auto">
        <div className="text-sm md:text-base">
          <h1 className="text-2xl font-medium capitalize md:text-3xl">
            {t("createNewContent")}
          </h1>
          <RegisterMessage />
        </div>
      </div>
    );
  }
  return <> {children} </>;
}
