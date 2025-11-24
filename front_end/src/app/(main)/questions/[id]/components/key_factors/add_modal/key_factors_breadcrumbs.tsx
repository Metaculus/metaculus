"use client";

import { faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import React from "react";

import cn from "@/utils/core/cn";

import { KFType } from "../types";

type Props = {
  selectedType: KFType;
  onRootClick: () => void;
  className?: string;
};

const KeyFactorsBreadcrumbs: React.FC<Props> = ({
  selectedType,
  onRootClick,
  className,
}) => {
  const t = useTranslations();

  return (
    <h2
      className={cn(
        "mb-6 mt-0 flex items-center gap-3 text-xl font-bold antialiased",
        !selectedType && "text-blue-800 dark:text-blue-800-dark",
        selectedType && "text-blue-500 dark:text-blue-500-dark",
        className
      )}
    >
      <div
        onClick={onRootClick}
        className="flex cursor-pointer items-center gap-2"
        role="button"
      >
        <span className={cn("sm:block", selectedType && "hidden")}>
          {t("addKeyFactors")}
        </span>
        {selectedType && <span className="sm:hidden">{t("add")}</span>}
      </div>

      {selectedType && (
        <>
          <FontAwesomeIcon
            icon={faChevronRight}
            size="lg"
            className="text-lg"
          />
          <span className="text-blue-800 dark:text-blue-800-dark">
            {selectedType === "driver"
              ? t("driver")
              : selectedType === "base_rate"
                ? t("baseRate")
                : t("news")}
          </span>
        </>
      )}
    </h2>
  );
};

export default KeyFactorsBreadcrumbs;
