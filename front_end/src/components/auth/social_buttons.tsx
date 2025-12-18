"use client";

import { faFacebook } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import React, { FC, useEffect, useState } from "react";

import { getSocialProviders } from "@/app/(main)/actions";
import { Google } from "@/components/icons/google";
import Button from "@/components/ui/button";
import LoadingSpinner from "@/components/ui/loading_spiner";
import { SocialProvider } from "@/types/auth";
import { addUrlParams } from "@/utils/navigation";

type SocialButtonsType = {
  type: "signin" | "signup";
};

const SocialButtons: FC<SocialButtonsType> = ({ type }) => {
  const t = useTranslations();
  const [socialProviders, setSocialProviders] = useState<SocialProvider[]>();
  const pathname = usePathname();

  useEffect(() => {
    getSocialProviders()
      .then(setSocialProviders)
      .catch(() => setSocialProviders([]));
  }, []);

  const constructSocialUrl = (originalUrl: string) =>
    addUrlParams(originalUrl, [
      {
        paramName: "state",
        paramValue: JSON.stringify({ redirect: pathname }),
      },
    ]);

  return (
    <>
      {socialProviders === undefined && <LoadingSpinner size="1x" />}
      {socialProviders &&
        socialProviders.map((provider) => {
          switch (provider.name) {
            case "google-oauth2":
              return (
                <Button
                  key={provider.name}
                  href={constructSocialUrl(provider.auth_url)}
                  variant="tertiary"
                  size="sm"
                  className="w-full"
                >
                  <Google className="mr-2 flex-none" />
                  <span className="flex-1 whitespace-nowrap text-center">
                    {type == "signin"
                      ? t("loginGoogle")
                      : t("registrationGoogle")}
                  </span>
                </Button>
              );
            case "facebook":
              return (
                <Button
                  key={provider.name}
                  href={constructSocialUrl(provider.auth_url)}
                  variant="tertiary"
                  size="sm"
                  className="w-full"
                >
                  <FontAwesomeIcon
                    icon={faFacebook}
                    className="mr-2 flex-none text-[#1877F2]"
                  />
                  <span className="flex-1 whitespace-nowrap text-center">
                    {type == "signin"
                      ? t("loginFacebook")
                      : t("registrationFacebook")}
                  </span>
                </Button>
              );
          }
        })}
    </>
  );
};

export default SocialButtons;
