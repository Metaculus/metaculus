import { redirect } from "next/navigation";

import EmailNotifications from "@/app/(main)/accounts/settings/notifications/components/email_notifications";
import QuestionNotifications from "@/app/(main)/accounts/settings/notifications/components/question_notifications";
import serverMiscApi from "@/services/api/misc/misc.server";
import ServerPostsApi from "@/services/api/posts/posts.server";
import ServerProfileApi from "@/services/api/profile/profile.server";

export const metadata = {
  title: "Notification Settings",
};

export default async function Page() {
  const currentUser = await ServerProfileApi.getMyProfile();
  if (!currentUser) return redirect("/");
  const [posts, isNewsletterSubscribed] = await Promise.all([
    ServerPostsApi.getAllSubscriptions(),
    serverMiscApi.isNewsletterSubscribed(currentUser.email).catch(() => false),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <EmailNotifications
        user={currentUser}
        isNewsletterSubscribed={isNewsletterSubscribed}
      />
      <QuestionNotifications posts={posts} revalidateSubscriptions />
    </div>
  );
}
