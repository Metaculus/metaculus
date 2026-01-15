"use client";

import Image from "next/image";
import Link from "next/link";
import React from "react";

import cn from "@/utils/core/cn";

import FELogoDark from "../assets/FE-logo-dark.svg?url";
import FELogoLight from "../assets/FE-logo-light.svg?url";
import { FE_COLORS, FE_LOGO_SIZES } from "../theme";

export type TabItem = {
  value: string;
  href: string;
  label: string;
};

type Props = {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (value: string) => void;
};

const FutureEvalHeader: React.FC<Props> = ({
  tabs,
  activeTab,
  onTabChange,
}) => {
  // Logo sizes are controlled by FE_LOGO_SCALE in theme.ts
  const logoStyle = {
    "--logo-mobile": `${FE_LOGO_SIZES.mobile}px`,
    "--logo-desktop": `${FE_LOGO_SIZES.desktop}px`,
  } as React.CSSProperties;

  return (
    <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
      {/* Logo - sizes controlled by FE_LOGO_SCALE in theme.ts */}
      <div
        className="flex flex-col items-center lg:items-start"
        style={logoStyle}
      >
        <Image
          src={FELogoLight}
          alt="FutureEval"
          width={FE_LOGO_SIZES.desktop}
          height={Math.round(FE_LOGO_SIZES.desktop * 0.287)}
          className="h-auto w-[var(--logo-mobile)] dark:hidden sm:w-[var(--logo-desktop)]"
          priority
        />
        <Image
          src={FELogoDark}
          alt="FutureEval"
          width={FE_LOGO_SIZES.desktop}
          height={Math.round(FE_LOGO_SIZES.desktop * 0.287)}
          className="hidden h-auto w-[var(--logo-mobile)] dark:block sm:w-[var(--logo-desktop)]"
          priority
        />
      </div>

      {/* Tab navigation */}
      <nav className="flex justify-center lg:justify-end">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-3 sm:gap-x-6 lg:gap-x-8">
          {tabs.map((tab) => (
            <FutureEvalTabLink
              key={tab.value}
              tab={tab}
              isActive={activeTab === tab.value}
              onClick={() => onTabChange(tab.value)}
            />
          ))}
        </div>
      </nav>
    </div>
  );
};

type TabLinkProps = {
  tab: TabItem;
  isActive: boolean;
  onClick: () => void;
};

const FutureEvalTabLink: React.FC<TabLinkProps> = ({
  tab,
  isActive,
  onClick,
}) => {
  return (
    <Link
      href={tab.href}
      onClick={onClick}
      className={cn(
        "pb-1 font-sans text-xs font-medium transition-colors sm:text-sm",
        isActive
          ? FE_COLORS.textAccent
          : `${FE_COLORS.textMuted} hover:${FE_COLORS.textSecondary}`
      )}
      style={{
        textDecoration: "none",
        boxShadow: isActive ? "inset 0 -2px 0 0 currentColor" : "none",
      }}
    >
      {tab.label}
    </Link>
  );
};

export default FutureEvalHeader;
