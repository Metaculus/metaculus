"use client";

import { faNewspaper } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC } from "react";

import cn from "@/utils/core/cn";

type Props = {
  enabled: boolean;
  onToggle: () => void;
};

const NewsAnnotationToggle: FC<Props> = ({ enabled, onToggle }) => {
  const t = useTranslations();
  return (
    <button
      className={cn(
        "relative hidden size-[18px] items-center justify-center overflow-visible rounded-full border text-[10px] transition-colors md:flex",
        enabled
          ? "border-blue-700 bg-gray-0 text-blue-700 dark:border-blue-700-dark dark:bg-gray-0-dark dark:text-blue-700-dark"
          : "border-blue-800/30 bg-gray-0 text-blue-800/30 dark:border-blue-800-dark/30 dark:bg-gray-0-dark dark:text-blue-800-dark/30"
      )}
      onClick={onToggle}
      aria-label={t("toggleNewsAnnotations")}
    >
      <FontAwesomeIcon icon={faNewspaper} className="text-[10px]" />
      {!enabled && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="h-[1.5px] w-[24px] rotate-[-45deg] rounded-full bg-gray-800 dark:bg-gray-800-dark" />
        </div>
      )}
    </button>
  );
};

export default NewsAnnotationToggle;
