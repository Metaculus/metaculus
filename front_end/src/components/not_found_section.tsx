"use client";

import { useTranslations } from "next-intl";
import { FC } from "react";

import Button from "@/components/ui/button";
import { useModal } from "@/contexts/modal_context";
import { usePublicSettings } from "@/contexts/public_settings_context";
import cn from "@/utils/core/cn";

type Props = {
  className?: string;
};

const NotFoundSection: FC<Props> = ({ className }) => {
  const t = useTranslations();
  const { setCurrentModal } = useModal();
  const { PUBLIC_LANDING_PAGE_URL } = usePublicSettings();
  return (
    <div
      className={cn(
        "flex min-h-screen flex-grow flex-col items-center justify-center self-center px-4",
        className
      )}
    >
      <h1 className="m-0">{t("pageNotFound")}</h1>
      <p className="my-4 max-w-md text-balance text-center text-base">
        {t.rich("thinkSupposedPageNote", {
          link: (chunk) => (
            <Button
              variant="link"
              className="text-primary-500 text-base font-normal dark:text-gray-200"
              onClick={() => setCurrentModal({ type: "contactUs" })}
            >
              {chunk}
            </Button>
          ),
        })}
      </p>
      <Button variant="primary" href={PUBLIC_LANDING_PAGE_URL ?? "/"} size="md">
        {t("returnToHomePage")}
      </Button>
    </div>
  );
};

export default NotFoundSection;
