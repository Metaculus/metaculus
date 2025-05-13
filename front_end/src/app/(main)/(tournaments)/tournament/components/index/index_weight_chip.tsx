import { faMinus, faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import React, { FC } from "react";

import cn from "@/utils/core/cn";

type Props = {
  value: number;
};

const IndexWeightChip: FC<Props> = ({ value }) => {
  const t = useTranslations();

  const isNegative = value < 0;

  return (
    <div className="flex items-center gap-1">
      <span className="font-normal capitalize text-gray-500 dark:text-gray-500-dark md:hidden">
        {t("weight") + ":"}
      </span>

      <div
        className={cn(
          "flex w-fit items-center justify-center gap-1 rounded-full px-2 py-[1px] md:mx-auto md:px-3.5 md:py-[1.5px]",
          isNegative
            ? "bg-salmon-300 dark:bg-salmon-300-dark"
            : "bg-olive-300 dark:bg-olive-300-dark"
        )}
      >
        <span
          className={cn(
            "text-xs font-bold leading-4 md:text-base md:font-medium md:leading-6",
            isNegative
              ? "text-salmon-800 dark:text-salmon-800-dark"
              : "text-olive-800 dark:text-olive-800-dark"
          )}
        >
          {Math.round(Math.abs(value) * 10) / 10}
        </span>
        {!!value && (
          <FontAwesomeIcon
            icon={isNegative ? faMinus : faPlus}
            className={cn(
              "text-xs font-black leading-3 md:text-sm md:leading-4",
              isNegative
                ? "text-salmon-800 dark:text-salmon-800-dark"
                : "text-olive-800 dark:text-olive-800-dark"
            )}
          />
        )}
      </div>
    </div>
  );
};

export default IndexWeightChip;
