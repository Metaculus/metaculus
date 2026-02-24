"use client";

import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { capitalize } from "lodash";
import { useTranslations } from "next-intl";
import { FC, RefObject, useEffect, useState } from "react";
import { createPortal } from "react-dom";

import cn from "@/utils/core/cn";

import { ImpactOption } from "./use_vote_impact_panel";

type Props = {
  ref?: RefObject<HTMLDivElement | null>;
  selectedOption: ImpactOption | null;
  isCompact?: boolean;
  anchorRef: RefObject<HTMLDivElement | null>;
  onSelect: (option: ImpactOption) => void;
  onClose: () => void;
};

const IMPACT_OPTIONS: ImpactOption[] = ["low", "medium", "high"];

const VoteImpactPanel: FC<Props> = ({
  ref,
  selectedOption,
  isCompact,
  anchorRef,
  onSelect,
  onClose,
}) => {
  const t = useTranslations();
  const [style, setStyle] = useState<React.CSSProperties>({
    position: "fixed",
    opacity: 0,
  });

  useEffect(() => {
    if (!anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    setStyle({
      position: "fixed",
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      zIndex: 50,
      opacity: 1,
    });
  }, [anchorRef]);

  const panel = (
    <div
      ref={ref}
      style={style}
      className={cn(
        "flex flex-col items-center rounded-xl bg-blue-200 shadow-lg ring-1 ring-blue-400 dark:bg-blue-200-dark dark:ring-blue-400-dark",
        isCompact ? "gap-1.5 px-3 py-2" : "gap-2.5 px-5 py-3"
      )}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <span
        className={cn(
          "font-medium leading-3 text-gray-500 dark:text-gray-500-dark",
          isCompact ? "text-[8px]" : "text-[10px]"
        )}
      >
        {t("voteOnImpact")}
      </span>

      <div className={cn("flex w-full", isCompact ? "gap-1.5" : "gap-2")}>
        {IMPACT_OPTIONS.map((option) => {
          const isSelected = selectedOption === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => onSelect(option)}
              className={cn(
                "flex-1 rounded border text-xs font-medium leading-4 transition-colors",
                isCompact ? "px-1.5 py-0.5" : "px-2 py-1",
                isSelected
                  ? "border-blue-600 bg-blue-600 text-gray-0 dark:border-blue-600-dark dark:bg-blue-600-dark dark:text-gray-0-dark"
                  : "border-blue-400 bg-gray-0 text-blue-800 hover:bg-blue-100 dark:border-blue-400-dark dark:bg-gray-0-dark dark:text-blue-800-dark dark:hover:bg-blue-100-dark"
              )}
            >
              {capitalize(t(option))}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onClose}
        className="absolute right-2.5 top-2.5 flex items-center justify-center text-blue-500 hover:text-blue-700 dark:text-blue-500-dark dark:hover:text-blue-700-dark"
      >
        <FontAwesomeIcon icon={faXmark} className="text-xs" />
      </button>
    </div>
  );

  return createPortal(panel, document.body);
};

export default VoteImpactPanel;
