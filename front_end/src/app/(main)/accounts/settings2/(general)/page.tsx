import invariant from "ts-invariant";

import ServerProfileApi from "@/services/api/profile/profile.server";

import DisplayPreferences from "./components/display_preferences";
import PredictionPreferences from "./components/prediction_preferences";

export default async function Settings() {
  const currentUser = await ServerProfileApi.getMyProfile();
  invariant(currentUser);

  return (
    <div className="flex flex-col gap-6">
      <DisplayPreferences user={currentUser} />
      <PredictionPreferences user={currentUser} />
    </div>
  );
}
