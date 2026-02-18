import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import PrivateNotes from "@/app/(main)/accounts/profile/components/private_notes";
import ServerProfileApi from "@/services/api/profile/profile.server";
import { SearchParams } from "@/types/navigation";

type Props = {
  params: Promise<{ id: number }>;
  searchParams: Promise<SearchParams>;
};

export default async function Page(props: Props) {
  const t = await getTranslations();
  const params = await props.params;
  const user = await ServerProfileApi.getMyProfile();

  if (+params.id !== user?.id) {
    return notFound();
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="flex flex-col gap-6 rounded bg-white p-6 dark:bg-blue-900 ">
        <h3 className="my-0 py-0 text-gray-700 dark:text-gray-300">
          {t("privateNotes")}
        </h3>

        <PrivateNotes />
      </div>
    </div>
  );
}
