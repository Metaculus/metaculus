"use client";

import { useTranslations } from "next-intl";
import React, { FC } from "react";
import toast from "react-hot-toast";

import Button from "@/components/ui/button";

import { emailMeMyData } from "../actions";

const EmailMeMyData: FC = () => {
  const t = useTranslations();

  const emailMe = async () => {
    try {
      const response = await emailMeMyData();
      if (response && "errors" in response && !!response.errors) {
        toast.error(t("emailMeError"));
      } else {
        toast.success(t("emailScheduled"));
      }
    } finally {
    }
  };

  return (
    <section className="text-sm">
      <hr />
      <h2 className="mb-5 mt-3 px-1"> {t("emailMeMyData")}</h2>
      <div className="text-sm">
        <p>{t("emailMeMyDataStatement")}</p>
        <div className="mt-4 flex items-center">
          <Button variant="secondary" type="submit" onClick={() => emailMe()}>
            {t("emailMe")}
          </Button>
        </div>
      </div>
    </section>
  );
};

export default EmailMeMyData;
