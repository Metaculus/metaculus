import { notFound } from "next/navigation";

import UserInfo from "@/app/(main)/accounts/profile/components/user_info";
import CommentFeed from "@/components/comment_feed";
import CommentApi from "@/services/comments";
import ProfileApi from "@/services/profile";

export default async function Profile({
  params: { id },
}: {
  params: { id: number };
}) {
  const currentUser = await ProfileApi.getMyProfile();
  const isCurrentUser = currentUser?.id === +id;

  const profile = isCurrentUser
    ? currentUser
    : await ProfileApi.getProfileById(id);

  const comments = await CommentApi.getComments({ author: id });

  if (!profile) {
    return notFound();
  }

  return (
    <main className="mx-auto min-h-min w-full max-w-3xl flex-auto rounded bg-gray-0 p-0 dark:bg-gray-0-dark sm:p-2 sm:pt-0 md:p-3 lg:mt-4">
      <UserInfo profile={profile} isCurrentUser={isCurrentUser} />
      {comments && (
        <CommentFeed initialComments={comments} profileId={profile.id} />
      )}
    </main>
  );
}
