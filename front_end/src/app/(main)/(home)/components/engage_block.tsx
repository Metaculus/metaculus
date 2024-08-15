"use client";

import { useTranslations } from "next-intl";
import { FC } from "react";

import Button from "@/components/ui/button";
import { useModal } from "@/contexts/modal_context";

const EngageBlock: FC = () => {
  const { setCurrentModal } = useModal();
  const t = useTranslations();

  return (
    <div className="my-6 flex flex-col gap-10 rounded-md bg-blue-900 p-10 dark:bg-blue-900-dark sm:p-16 md:my-12 lg:my-16 lg:flex-row xl:px-24">
      <div>
        <h2 className="my-0 text-4xl tracking-tight text-blue-500 dark:text-blue-500-dark sm:text-5xl">
          {t("Engage with")}{" "}
          <span className="text-blue-200 dark:text-blue-200-dark">
            Metaculus
          </span>
        </h2>
        <div className="text-lg text-blue-200 dark:text-blue-200-dark lg:max-w-2xl">
          <p className="my-8">{t("learn how you can partner")}</p>
          <p className="my-0">{t("working with non-profits")}</p>
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center">
        <Button
          variant="tertiary"
          size="lg"
          className="whitespace-nowrap"
          onClick={() =>
            setCurrentModal({
              type: "contactUs",
              data: {
                defaultSubject: "Tag Feedback",
              },
            })
          }
        >
          {t("Contact Us")}
        </Button>
      </div>
    </div>
  );
};

export default EngageBlock;
