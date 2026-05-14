"use client";

import { FC, ReactNode } from "react";

type Props = {
  body: string;
  disclaimer: string;
  children: ReactNode;
};

/**
 * Wraps a Chamber Control row. The body sentence + disclaimer appear in a
 * tooltip directly below the row on hover. The wrapper exposes a `group/cr`
 * Tailwind named group so the tooltip can react to hovering anywhere in the
 * row.
 */
const ChamberRowTooltip: FC<Props> = ({ body, disclaimer, children }) => {
  return (
    <div className="group/cr relative">
      {children}
      <div
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 hidden w-max max-w-[260px] -translate-x-1/2 flex-col items-center gap-1 rounded-md bg-blue-800 px-3 py-2 text-center text-xs text-gray-0 shadow-lg group-hover/cr:flex dark:bg-blue-800-dark dark:text-gray-0-dark"
      >
        <span>{body}</span>
        <span className="text-[10px] opacity-80">{disclaimer}</span>
      </div>
    </div>
  );
};

export default ChamberRowTooltip;
