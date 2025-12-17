import invariant from "ts-invariant";

import EmailMeMyData from "@/app/(main)/accounts/settings/account/components/email_me_my_data";
import ServerProfileApi from "@/services/api/profile/profile.server";
import { getServerSession } from "@/services/session";

import ApiAccess from "./components/api_access";
import ChangePassword from "./components/change_password";
import EmailEdit from "./components/email_edit";
import PreferencesSection from "../components/preferences_section";

export const metadata = {
  title: "Account Settings",
};

export default async function Settings() {
  const currentUser = await ServerProfileApi.getMyProfile();
  const token = await getServerSession();
  invariant(currentUser);
  invariant(token);

  return (
    <PreferencesSection className="gap-0">
      <EmailEdit user={currentUser} />
      <ChangePassword />
      <ApiAccess token={token} />
      <EmailMeMyData />
    </PreferencesSection>
  );
}
