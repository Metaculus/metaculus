"use client";

import Link from "next/link";
import React from "react";

import { MetaculusMark } from "@/components/logos";
import cn from "@/utils/core/cn";

import { FE_COLORS } from "../../theme";

/**
 * MetaculusHub - The central element of the orbit showing Metaculus Platform branding
 */
const MetaculusHub: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center text-center">
      {/* Logo and Title - side by side */}
      <Link href="/" className="flex items-center gap-2 no-underline">
        {/* M Logo Icon */}
        <div
          className={cn(
            "flex flex-shrink-0 items-center justify-center rounded-sm",
            "bg-futureeval-bg-dark dark:bg-futureeval-bg-light"
          )}
          style={{ width: 36, height: 36 }}
        >
          <MetaculusMark className="h-[18px] w-auto text-futureeval-bg-light dark:text-futureeval-bg-dark" />
        </div>

        {/* Title */}
        <span
          className={cn(
            "text-left font-sans text-xs font-semibold leading-tight lg:text-base",
            FE_COLORS.textPrimary
          )}
        >
          Metaculus
          <br />
          Platform
        </span>
      </Link>

      {/* Stats */}
      <div className="mt-2">
        <span
          className={cn(
            "font-sans text-[10px] leading-tight lg:text-xs",
            FE_COLORS.textSecondary
          )}
        >
          3.2M+ predictions,
        </span>
      </div>

      <span
        className={cn(
          "mt-0.5 font-sans text-[10px] lg:text-xs",
          FE_COLORS.textAccent
        )}
      >
        12 years, 22k questions
      </span>
    </div>
  );
};

export default MetaculusHub;
