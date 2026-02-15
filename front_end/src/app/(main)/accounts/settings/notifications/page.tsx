import { redirect } from "next/navigation";

import ServerProfileApi from "@/services/api/profile/profile.server";

import DefaultFollowNotifications from "./components/default_follow_notifications";
import KeepingUp from "./components/keeping_up";
import SiteNews from "./components/site_news";

export const metadata = {
  title: "Notification Settings",
};

export default async function Page() {
  const currentUser = await ServerProfileApi.getMyProfile();
  if (!currentUser) return redirect("/");

  return (
    <div className="flex flex-col gap-6">
      <SiteNews user={currentUser} />
      <KeepingUp user={currentUser} />
      <DefaultFollowNotifications user={currentUser} />
    </div>
  );
}
