import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import AwaitedPostsFeed from "@/components/posts_feed";
import LoadingIndicator from "@/components/ui/loading_indicator";
import { PostsParams } from "@/services/api/posts/posts.shared";
import ServerProfileApi from "@/services/api/profile/profile.server";
import { SearchParams } from "@/types/navigation";
import { formatUsername } from "@/utils/formatters/users";

type Props = {
  params: Promise<{ id: number }>;
  searchParams: Promise<SearchParams>;
};

export default async function Questions(props: Props) {
  const params = await props.params;
  const profile = await ServerProfileApi.getProfileById(params.id);
  const userQuestionsFilters: PostsParams = { usernames: profile.username };
  const t = await getTranslations();

  return (
    <div className="flex flex-col gap-6 rounded bg-white p-4 dark:bg-blue-900 md:p-6">
      <h3 className="my-0 py-0 text-gray-700 dark:text-gray-300">
        {t("questionsBy") + " " + formatUsername(profile)}
      </h3>

      <Suspense
        key={JSON.stringify(props.searchParams)}
        fallback={
          <LoadingIndicator className="mx-auto h-8 w-24 text-gray-600 dark:text-gray-600-dark" />
        }
      >
        <AwaitedPostsFeed filters={userQuestionsFilters} />
      </Suspense>
    </div>
  );
}
