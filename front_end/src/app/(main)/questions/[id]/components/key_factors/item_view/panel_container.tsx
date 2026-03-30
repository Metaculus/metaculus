"use client";

import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { CSSProperties, FC, PropsWithChildren, RefObject } from "react";
import { createPortal } from "react-dom";

import cn from "@/utils/core/cn";

type Props = PropsWithChildren<{
  ref?: RefObject<HTMLDivElement | null>;
  anchorRef: RefObject<HTMLDivElement | null>;
  isCompact?: boolean;
  inline?: boolean;
  onClose: () => void;
}>;

function getAnchorStyle(
  anchorRef: RefObject<HTMLDivElement | null>
): CSSProperties {
  if (!anchorRef.current) {
    return { position: "fixed", opacity: 0 };
  }
  const rect = anchorRef.current.getBoundingClientRect();
  return {
    position: "fixed",
    top: rect.bottom + 4,
    left: rect.left,
    width: rect.width,
    zIndex: 210,
  };
}

const PanelContainer: FC<Props> = ({
  ref,
  anchorRef,
  isCompact,
  inline,
  onClose,
  children,
}) => {
  const panel = (
    <div
      ref={ref}
      style={inline ? undefined : getAnchorStyle(anchorRef)}
      className={cn(
        "relative rounded-xl bg-blue-200 shadow-lg ring-1 ring-blue-400 dark:bg-blue-200-dark dark:ring-blue-400-dark",
        isCompact ? "px-3 py-2" : "px-5 py-3",
        inline && "mt-1"
      )}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div
        className={cn(
          "flex flex-col items-center",
          isCompact ? "gap-1.5" : "gap-2.5"
        )}
      >
        {children}
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

  if (inline) return panel;
  return createPortal(panel, document.body);
};

export default PanelContainer;
