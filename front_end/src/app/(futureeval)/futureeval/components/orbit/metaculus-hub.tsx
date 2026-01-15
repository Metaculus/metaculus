"use client";

import React from "react";

import cn from "@/utils/core/cn";

import { FE_COLORS } from "../../theme";

/**
 * MetaculusHub - The central element of the orbit showing Metaculus Platform branding
 */
const MetaculusHub: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center text-center">
      {/* Logo and Title - side by side */}
      <div className="flex items-center gap-2">
        {/* M Logo Icon */}
        <div
          className={cn(
            "flex flex-shrink-0 items-center justify-center rounded-sm",
            "bg-futureeval-bg-dark dark:bg-futureeval-bg-light"
          )}
          style={{ width: 36, height: 36 }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 20 20"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
            className="text-futureeval-bg-light dark:text-futureeval-bg-dark"
          >
            <path d="M7.76271 17V7.11394L9.52542 17H10.4294L12.1921 7.11394V17H14V3H11.4689L9.9774 9.96852L8.48588 3H6V17H7.76271Z" />
          </svg>
        </div>

        {/* Title */}
        <span
          className={cn(
            "text-left font-sans text-base font-semibold leading-tight",
            FE_COLORS.textPrimary
          )}
        >
          Metaculus
          <br />
          Platform
        </span>
      </div>

      {/* Stats */}
      <div className="mt-2">
        <span
          className={cn(
            "font-sans text-xs leading-tight",
            FE_COLORS.textSecondary
          )}
        >
          3.2M+ predictions in <span className="font-semibold">12 years</span>
        </span>
      </div>

      {/* Subtext link */}
      <span
        className={cn(
          "mt-0.5 font-sans text-xs",
          FE_COLORS.textAccent,
          "cursor-default"
        )}
      >
        best human forecasters
      </span>
    </div>
  );
};

export default MetaculusHub;
