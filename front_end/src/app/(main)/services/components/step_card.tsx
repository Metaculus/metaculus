"use client";

import cn from "classnames";
import { useTranslations } from "next-intl";
import { FC } from "react";

type Props = {
  step: number;
  title: string;
  description: string;
  className?: string;
};

const StepCard: FC<Props> = ({ step, title, description, className }) => {
  const t = useTranslations();
  return (
    <div
      className={cn(
        "flex flex-col items-start gap-2.5 bg-gray-0 p-6 dark:bg-gray-0-dark xl:p-10",
        className
      )}
    >
      <p className="m-0 text-[16px] uppercase leading-[16px] text-blue-600 dark:text-blue-600-dark">
        {t("stepX", { step })}
      </p>
      <h6 className="m-0 font-serif text-2xl font-semibold text-gray-800 dark:text-gray-200">
        {title}
      </h6>
      <p className="m-0 text-base text-gray-600 dark:text-gray-600-dark">
        {description}
      </p>
    </div>
  );
};

export default StepCard;
