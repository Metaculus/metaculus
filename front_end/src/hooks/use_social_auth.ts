import { useEffect, useState } from "react";

import { getSocialProviders } from "@/app/(main)/actions";
import { useAuth } from "@/contexts/auth_context";
import { SocialProvider } from "@/types/auth";
import { addUrlParams } from "@/utils/navigation";

const useSocialAuth = () => {
  const [socialProviders, setSocialProviders] = useState<SocialProvider[]>();
  const { csrfToken } = useAuth();

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
        paramValue: JSON.stringify({ redirect: redirectUrl, nonce: csrfToken }),
      },
    ]);
  };

  return { socialProviders, getOAuthUrl };
};

export default useSocialAuth;
