import invariant from "ts-invariant";

import ServerProfileApi from "@/services/api/profile/profile.server";

export default async function Settings() {
  const currentUser = await ServerProfileApi.getMyProfile();
  invariant(currentUser);

  return (
    <>
      <h2>General Settings</h2>
    </>
  );
}
