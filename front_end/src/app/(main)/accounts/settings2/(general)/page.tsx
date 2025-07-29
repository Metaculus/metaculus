import invariant from "ts-invariant";

import GeneralDisplay from "@/app/(main)/accounts/settings2/(general)/components/general_display";
import ServerProfileApi from "@/services/api/profile/profile.server";

export default async function Settings() {
  const currentUser = await ServerProfileApi.getMyProfile();
  invariant(currentUser);

  return (
    <>
      <GeneralDisplay user={currentUser} />
    </>
  );
}
