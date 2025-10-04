"use client";

import { FloatingPortal } from "@floating-ui/react";
import { isNil } from "lodash";
import { useTranslations } from "next-intl";
import { CSSProperties, memo } from "react";

type Props = {
  active: boolean;
  placement: "in" | "below" | "above" | null;
  resolution?: string | number | null;
  setFloating: (node: HTMLElement | null) => void;
  floatingStyles: CSSProperties;
  getFloatingProps: () => Record<string, unknown>;
};

const ResolutionTooltip = ({
  active,
  placement,
  resolution,
  setFloating,
  floatingStyles,
  getFloatingProps,
}: Props) => {
  const t = useTranslations();
  if (!active) return null;

  const boundText =
    placement === "below"
      ? t("belowLowerBound")
      : placement === "above"
        ? t("aboveUpperBound")
        : "";

  return (
    <FloatingPortal>
      <div
        ref={setFloating}
        style={floatingStyles}
        {...getFloatingProps()}
        className="pointer-events-none z-100"
      >
        <div className="rounded-sm bg-purple-800 px-1.5 py-1 text-xs shadow-lg">
          <div className="flex w-full justify-center gap-2 font-semibold text-gray-0">
            <span>Resolved</span>
            {!isNil(resolution) && resolution !== boundText && (
              <span>{String(resolution)}</span>
            )}
          </div>

          <div className="text-center text-gray-0">{boundText}</div>
        </div>
      </div>
    </FloatingPortal>
  );
};

export default memo(ResolutionTooltip);
