"use client";
import { useTranslations } from "next-intl";
import React, { FC } from "react";

import Button from "@/app/(main)/about/components/Button";
import { useHideCP } from "@/contexts/cp_context";
import cn from "@/utils/core/cn";

type Props = {
  className?: string;
};

const RevealCPButton: FC<Props> = ({ className }) => {
  const { setCurrentHideCP } = useHideCP();
  const t = useTranslations();

  return (
    <div className={cn("text-center", className)}>
      <div className="text-l m-4">{t("CPIsHidden")}</div>
      <Button onClick={() => setCurrentHideCP(false)}>
        {t("RevealTemporarily")}
      </Button>
    </div>
  );
};

export default RevealCPButton;
