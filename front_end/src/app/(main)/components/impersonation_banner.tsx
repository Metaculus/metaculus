"use client";

import { useTranslations } from "next-intl";
import { FC, useState } from "react";

import { stopImpersonatingAction } from "@/app/(main)/accounts/settings/actions";
import Button from "@/components/ui/button";
import { useAuth } from "@/contexts/auth_context";

const ImpersonationBanner: FC = () => {
  const t = useTranslations();
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const handleStop = async () => {
    setIsLoading(true);
    await stopImpersonatingAction();
  };

  if (!user?.is_bot) return;

  return (
    <div className="text-med -mb-12 mt-12 flex w-full items-center justify-center gap-4 border-b border-t border-orange-400 bg-orange-50 p-2 text-sm leading-6 text-orange-900 dark:border-orange-400-dark dark:bg-orange-50-dark dark:text-orange-900-dark sm:px-6">
      <span>{t("impersonationBannerText")}</span>
      <Button
        onClick={handleStop}
        disabled={isLoading}
        size="sm"
        variant="tertiary"
      >
        {t("stopImpersonating")}
      </Button>
    </div>
  );
};

export default ImpersonationBanner;
