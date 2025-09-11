"use client";

import { FloatingPortal } from "@floating-ui/react";
import { useTranslations } from "next-intl";
import { ComponentProps, FC, useEffect, useRef, useState } from "react";
import { VictoryLabel } from "victory";

import cn from "@/utils/core/cn";

type Props = ComponentProps<typeof VictoryLabel> & {
  chartHeight: number;
  formatValue: (y: number) => string;
  getValueForX: (xName: string) => number | null;
};

const IndexValueTooltip: FC<Props> = ({
  x,
  y,
  datum,
  chartHeight,
  formatValue,
  getValueForX,
}) => {
  const t = useTranslations();
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  const xName = datum?.xName ?? datum?.x;
  const value = typeof xName === "string" ? getValueForX(xName) : null;

  useEffect(() => {
    requestAnimationFrame(() => {
      const r = ref.current?.getBoundingClientRect();
      if (r) setSize({ w: r.width, h: r.height });
    });
  }, [x, y, value]);

  if (typeof x !== "number" || typeof y !== "number" || value == null) {
    return null;
  }

  const label = `${t("indexValue")} ${formatValue(value)}`;
  const TOP_PAD = 10;
  const pos = y + TOP_PAD + size.h > chartHeight ? "top" : "bottom";

  return (
    <FloatingPortal id="fan-graph-container">
      <div
        ref={ref}
        className={cn(
          "pointer-events-none absolute z-[100] whitespace-nowrap rounded border border-gray-300 bg-gray-0 px-3 py-2 text-sm shadow-lg",
          "dark:border-gray-300-dark dark:bg-gray-0-dark",
          !size.w && !size.h ? "opacity-0" : "opacity-100"
        )}
        style={{
          left: x - size.w / 2,
          top: pos === "bottom" ? y + TOP_PAD : y - size.h - TOP_PAD,
        }}
      >
        {label}
      </div>
    </FloatingPortal>
  );
};
export default IndexValueTooltip;
