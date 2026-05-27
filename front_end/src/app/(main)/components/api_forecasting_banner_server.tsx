import ServerProfileApi from "@/services/api/profile/profile.server";
import { ApiForecastingAccess } from "@/types/users";

import { ApiForecastingBannerClient } from "./api_forecasting_banner_client";

// Site-wide alert shown while the account's API forecasting is "pending" — i.e.
// a blocked API forecast is awaiting the user's confirmation. Rendered by
// TopChrome so it appears on every page until resolved or dismissed.
export const ApiForecastingBanner = async () => {
  const currentUser = await ServerProfileApi.getMyProfile();

  if (currentUser?.api_forecasting_access !== ApiForecastingAccess.Pending) {
    return null;
  }

  return <ApiForecastingBannerClient />;
};
