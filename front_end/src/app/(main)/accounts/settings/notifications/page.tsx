import { redirect } from "next/navigation";

import EmailNotifications from "@/app/(main)/accounts/settings/notifications/components/email_notifications";
import QuestionNotifications from "@/app/(main)/accounts/settings/notifications/components/question_notifications";
import ServerPostsApi from "@/services/api/posts/posts.server";
import ServerProfileApi from "@/services/api/profile/profile.server";

export const metadata = {
  title: "Notification Settings",
};

export default async function Page() {
  const currentUser = await ServerProfileApi.getMyProfile();
  if (!currentUser) return redirect("/");
  const posts = await ServerPostsApi.getAllSubscriptions();

  return (
    <div className="flex flex-col gap-6">
      <EmailNotifications user={currentUser} />
      <QuestionNotifications posts={posts} revalidateSubscriptions />
    </div>
  );
}
