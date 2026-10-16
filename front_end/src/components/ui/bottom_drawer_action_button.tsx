"use client";

import { FC, ReactNode } from "react";

import cn from "@/utils/core/cn";

type Props = {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  className?: string;
};

/**
 * Big tappable tile for action grids inside BottomDrawer (styled to match
 * the capture drawer's option cards). Compose inside a
 * `grid grid-cols-2 gap-2` container; see share_post_drawer.tsx.
 */
const BottomDrawerActionButton: FC<Props> = ({
  icon,
  label,
  onClick,
  className,
}) => (
  <button
    onClick={onClick}
    className={cn(
      "flex min-h-[92px] cursor-pointer select-none flex-col items-center justify-center gap-2.5 rounded border border-blue-400 bg-gray-100 px-2 py-3 text-center text-sm font-semibold leading-snug text-blue-700 transition-colors duration-150 active:border-blue-600 active:bg-gray-200 dark:border-blue-400-dark dark:bg-gray-100-dark dark:text-blue-700-dark dark:active:border-blue-600-dark dark:active:bg-gray-200-dark",
      className
    )}
  >
    <span className="text-lg leading-none">{icon}</span>
    {label}
  </button>
);

export default BottomDrawerActionButton;
