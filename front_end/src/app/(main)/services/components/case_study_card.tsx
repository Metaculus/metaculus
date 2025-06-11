"use client";

import { useTranslations } from "next-intl";
import { FC } from "react";
import { PropsWithChildren } from "react";

import cn from "@/utils/core/cn";

type Props = PropsWithChildren<{
  title: string;
  className?: string;
}>;

const CaseStudyCard: FC<Props> = ({ title, className, children }) => {
  const t = useTranslations();
  return (
    <div
      className={cn(
        "flex flex-col justify-center rounded-2xl bg-blue-800 px-14 py-12",
        className
      )}
    >
      <p className="m-0 text-[20px] text-olive-500">{t("caseStudy")}</p>
      <p className="m-0 mt-5 text-[30px] leading-[140%] text-blue-200">
        {title}
      </p>
      <div className={"mt-5 text-lg text-blue-500"}>{children}</div>
    </div>
  );
};

export default CaseStudyCard;
