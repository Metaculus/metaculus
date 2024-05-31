"use client";

import { faFacebook } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FC, useEffect, useState } from "react";

import { Google } from "@/components/icons/google";
import Button from "@/components/ui/button";
import AuthApi from "@/services/auth";
import { SocialProvider } from "@/types/auth";

const SocialButtons: FC = () => {
  const [socialProviders, setSocialProviders] = useState<SocialProvider[]>();

  useEffect(() => {
    AuthApi.getSocialProviders(`${window.origin}/auth/social`).then(
      setSocialProviders
    );
  }, []);

  return (
    <>
      {socialProviders &&
        socialProviders.map((provider) => {
          switch (provider.name) {
            case "google-oauth2":
              return (
                <Button
                  key={provider.name}
                  href={provider.auth_url}
                  variant="tertiary"
                  size="sm"
                  className="mt-2 w-full"
                >
                  <Google className="mr-2 flex-none" />
                  <span className="flex-1 whitespace-nowrap text-center">
                    Log in with Google
                  </span>
                </Button>
              );
            case "facebook":
              return (
                <Button
                  key={provider.name}
                  href={provider.auth_url}
                  variant="tertiary"
                  size="sm"
                  className="mt-2 w-full"
                >
                  <FontAwesomeIcon
                    icon={faFacebook}
                    className="mr-2 flex-none text-[#1877F2]"
                  />
                  <span className="flex-1 whitespace-nowrap text-center">
                    Log in with Facebook
                  </span>
                </Button>
              );
          }
        })}
    </>
  );
};

export default SocialButtons;
