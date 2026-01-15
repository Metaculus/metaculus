"use client";

import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";

import ThemeToggle from "@/components/theme_toggle";
import Button from "@/components/ui/button";
import cn from "@/utils/core/cn";

import { FE_COLORS } from "../theme";

const FutureEvalNavbar: React.FC = () => {
  return (
    <header
      className={cn(
        "fixed left-0 top-0 z-[200] flex h-header w-full items-center justify-end px-3 sm:px-6 md:px-8",
        "bg-transparent"
      )}
    >
      {/* Right side: Platform button + Dark mode toggle */}
      <div className="flex items-center gap-3 sm:gap-4">
        <Button
          variant="text"
          size="sm"
          href="/"
          className={cn("gap-2", FE_COLORS.textPrimary, "hover:opacity-80")}
        >
          <FontAwesomeIcon icon={faArrowLeft} className="text-xs" />
          <span className="hidden sm:inline">Metaculus Platform</span>
          <span className="inline sm:hidden">Platform</span>
        </Button>

        <ThemeToggle />
      </div>
    </header>
  );
};

export default FutureEvalNavbar;
