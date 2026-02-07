import { redirect } from "next/navigation";

import ServerProfileApi from "@/services/api/profile/profile.server";

import DisplayPreferences from "./components/display_preferences";
import PredictionPreferences from "./components/prediction_preferences";

export const metadata = {
  title: "General Settings",
};

export default async function Settings() {
  const currentUser = await ServerProfileApi.getMyProfile();
  if (!currentUser) return redirect("/");

  return (
    <div className="flex flex-col gap-6">
      <DisplayPreferences user={currentUser} />
      <PredictionPreferences user={currentUser} />
    </div>
  );
}
