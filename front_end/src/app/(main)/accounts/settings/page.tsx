import { redirect } from "next/navigation";

import AccountPreferences from "@/app/(main)/accounts/settings/components/account_preferences";
import ApiAccess from "@/app/(main)/accounts/settings/components/api_access";
import ChangePassword from "@/app/(main)/accounts/settings/components/change_password";
import EmailMeMyData from "@/app/(main)/accounts/settings/components/email_me_my_data";
import EmailNotifications from "@/app/(main)/accounts/settings/components/email_notifications";
import QuestionNotifications from "@/app/(main)/accounts/settings/components/question_notifications";
import ServerPostsApi from "@/services/api/posts/posts.server";
import ServerProfileApi from "@/services/api/profile/profile.server";
import { getServerSession } from "@/services/session";

export default async function Settings() {
  const currentUser = await ServerProfileApi.getMyProfile();
  const token = await getServerSession();
  const posts = await ServerPostsApi.getAllSubscriptions();

  if (!token || !currentUser) return redirect("/");

  return (
    <main className="mx-auto min-h-min w-full max-w-3xl flex-auto rounded bg-gray-0 p-2 dark:bg-gray-0-dark sm:px-2 md:p-3 lg:my-4">
      <AccountPreferences user={currentUser} />
      <EmailNotifications user={currentUser} />
      <QuestionNotifications posts={posts} revalidateSubscriptions />
      <ChangePassword />
      <ApiAccess token={token} />
      <EmailMeMyData />
    </main>
  );
}
