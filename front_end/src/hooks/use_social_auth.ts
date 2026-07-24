import { useEffect, useState } from "react";

import { getSocialProviders } from "@/app/(main)/actions";
import { SocialProvider } from "@/types/auth";
import { rotateAndGetCsrfToken } from "@/utils/csrf";
import { addUrlParams } from "@/utils/navigation";

const useSocialAuth = () => {
  const [socialProviders, setSocialProviders] = useState<SocialProvider[]>();

  useEffect(() => {
    getSocialProviders()
      .then(setSocialProviders)
      .catch(() => setSocialProviders([]));
  }, []);

  const getOAuthUrl = (
    providerName: SocialProvider["name"],
    redirectUrl: string
  ) => {
    const provider = socialProviders?.find((p) => p.name === providerName);
    if (!provider) return null;

    return addUrlParams(provider.auth_url, [
      {
        paramName: "state",
        paramValue: JSON.stringify({
          redirect: redirectUrl,
          nonce: rotateAndGetCsrfToken(),
        }),
      },
    ]);
  };

  return { socialProviders, getOAuthUrl };
};

export default useSocialAuth;
