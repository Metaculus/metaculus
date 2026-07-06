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

  const sharedClassName = cn(
    "flex min-h-[100px] items-center justify-center overflow-hidden rounded-xl bg-[#e8eeee] dark:bg-blue-300-dark",
    "border border-transparent p-5 opacity-50 transition-opacity hover:opacity-100",
    onClick &&
      "cursor-pointer hover:border-blue-500 dark:hover:border-blue-500-dark",
    className
  );

  const content = (
    <div className="flex flex-col items-center gap-3 text-blue-700 dark:text-blue-700-dark">
      <FontAwesomeIcon icon={faPlus} className="size-[22px]" />
      <span className="whitespace-nowrap text-base capitalize leading-5">
        {t("addKeyFactor")}
      </span>
    </div>
  );

  return onClick ? (
    <button type="button" className={sharedClassName} onClick={onClick}>
      {content}
    </button>
  ) : (
    <div className={sharedClassName}>{content}</div>
  );
};

export default KeyFactorsGridPlaceholder;
