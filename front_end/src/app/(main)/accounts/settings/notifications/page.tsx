import { redirect } from "next/navigation";

import EmailNotifications from "@/app/(main)/accounts/settings/notifications/components/email_notifications";
import serverMiscApi from "@/services/api/misc/misc.server";
import ServerProfileApi from "@/services/api/profile/profile.server";

export const metadata = {
  title: "Notification Settings",
};

export default async function Page() {
  const currentUser = await ServerProfileApi.getMyProfile();
  if (!currentUser) return redirect("/");
  const isNewsletterSubscribed = await serverMiscApi
    .isNewsletterSubscribed(currentUser.email)
    .catch(() => false);

  return (
    <div className="flex flex-col gap-6">
      <EmailNotifications
        user={currentUser}
        isNewsletterSubscribed={isNewsletterSubscribed}
      />
    </div>
  );
}
