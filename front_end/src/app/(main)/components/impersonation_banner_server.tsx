import { getAuthCookieManager } from "@/services/auth_tokens";

import { ImpersonationBannerClient } from "./impersonation_banner_client";

export const ImpersonationBanner = async () => {
  const authManager = await getAuthCookieManager();
  const isImpersonating = authManager.isImpersonating();

  if (!isImpersonating) {
    return null;
  }

  return <ImpersonationBannerClient />;
};
