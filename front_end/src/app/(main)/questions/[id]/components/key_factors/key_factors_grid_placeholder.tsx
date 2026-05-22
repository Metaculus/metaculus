"use client";

import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC } from "react";

import cn from "@/utils/core/cn";

type Props = {
  className?: string;
  onClick?: () => void;
};

const KeyFactorsGridPlaceholder: FC<Props> = ({ className, onClick }) => {
  const t = useTranslations();

  return (
    <div
      className={cn(
        "flex min-h-[100px] items-center justify-center overflow-hidden rounded-xl bg-[#e8eeee] dark:bg-blue-300-dark",
        "border border-transparent p-5 opacity-50 transition-opacity hover:opacity-100",
        onClick &&
          "cursor-pointer hover:border-blue-500 dark:hover:border-blue-500-dark",
        className
      )}
      onClick={onClick}
    >
      <div className="flex flex-col items-center gap-3 text-blue-700 dark:text-blue-700-dark">
        <FontAwesomeIcon icon={faPlus} className="size-[22px]" />
        <span className="whitespace-nowrap text-base capitalize leading-5">
          {t("addKeyFactor")}
        </span>
      </div>
    </div>
  );
};

export default KeyFactorsGridPlaceholder;
