import invariant from "ts-invariant";

import EmailMeMyData from "@/app/(main)/accounts/settings/account/components/email_me_my_data";
import ServerAuthApi from "@/services/api/auth/auth.server";
import ServerProfileApi from "@/services/api/profile/profile.server";

import ApiAccess from "./components/api_access";
import ChangePassword from "./components/change_password";
import EmailEdit from "./components/email_edit";
import PreferencesSection from "../components/preferences_section";

export const metadata = {
  title: "Account Settings",
};

export default async function Settings() {
  const currentUser = await ServerProfileApi.getMyProfile();
  invariant(currentUser);

  const { key: apiKey } = await ServerAuthApi.getApiKey();

  return (
    <PreferencesSection className="gap-0">
      <EmailEdit user={currentUser} />
      <ChangePassword />
      <ApiAccess apiKey={apiKey} />
      <EmailMeMyData />
    </PreferencesSection>
  );
}
