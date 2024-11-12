"use client";
import { useTranslations } from "next-intl";
import React from "react";

import Button from "@/app/(main)/about/components/Button";

import { useHideCP } from "./cp_provider";

const RevealCPButton = () => {
  const { setCurrentHideCP } = useHideCP();
  const t = useTranslations();

  return (
    <div className="text-center">
      <div className="text-l m-4">{t("CPIsHidden")}</div>
      <Button onClick={() => setCurrentHideCP(false)}>
        {t("RevealTemporarily")}
      </Button>
    </div>
  );
};

export default RevealCPButton;
