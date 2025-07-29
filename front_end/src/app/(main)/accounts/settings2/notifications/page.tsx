import invariant from "ts-invariant";

import EmailNotifications from "@/app/(main)/accounts/settings2/notifications/components/email_notifications";
import QuestionNotifications from "@/app/(main)/accounts/settings2/notifications/components/question_notifications";
import ServerPostsApi from "@/services/api/posts/posts.server";
import ServerProfileApi from "@/services/api/profile/profile.server";

export default async function Page() {
  const currentUser = await ServerProfileApi.getMyProfile();
  const posts = await ServerPostsApi.getAllSubscriptions();
  invariant(currentUser);

  return (
    <div className="flex flex-col gap-6">
      <EmailNotifications user={currentUser} />
      <QuestionNotifications posts={posts} revalidateSubscriptions />
    </div>
  );
}
