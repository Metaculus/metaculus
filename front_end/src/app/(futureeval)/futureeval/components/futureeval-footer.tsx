"use client";

import Link from "next/link";
import React from "react";

import { useModal } from "@/contexts/modal_context";
import cn from "@/utils/core/cn";

import { FE_COLORS, FE_TYPOGRAPHY } from "../theme";
import FutureEvalSymbol from "./futureeval-symbol";

/**
 * Simple FutureEval footer
 */
const FutureEvalFooter: React.FC = () => {
  const { setCurrentModal } = useModal();

  const handleContactClick = () => setCurrentModal({ type: "contactUs" });

  return (
    <footer
      className={cn(
        "w-full px-4 sm:px-10 md:px-16",
        "border-t border-futureeval-bg-dark/10 dark:border-futureeval-bg-light/10"
      )}
    >
      <div className="mx-auto box-content max-w-[1044px] py-8">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          {/* Left: Logo and tagline */}
          <div className="flex items-center gap-3">
            <FutureEvalSymbol className="h-7 w-auto" />
            <span className={cn("text-sm", FE_COLORS.textSubheading)}>
              Measured with <span className={FE_COLORS.textAccent}>♥</span> by{" "}
              <Link
                href="https://metaculus.com"
                className={cn(
                  "no-underline hover:underline",
                  FE_COLORS.textHeading
                )}
              >
                Metaculus
              </Link>
            </span>
          </div>

          {/* Right: Links */}
          <div className="flex items-center gap-6 text-sm">
            <button
              type="button"
              onClick={handleContactClick}
              className={cn(
                "cursor-pointer border-none bg-transparent",
                FE_TYPOGRAPHY.link,
                FE_COLORS.textAccent
              )}
            >
              Contact
            </button>
            <Link
              href="/privacy-policy/"
              className={cn(
                FE_COLORS.textSubheading,
                "no-underline hover:underline"
              )}
            >
              Privacy
            </Link>
            <Link
              href="/terms-of-use/"
              className={cn(
                FE_COLORS.textSubheading,
                "no-underline hover:underline"
              )}
            >
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FutureEvalFooter;
