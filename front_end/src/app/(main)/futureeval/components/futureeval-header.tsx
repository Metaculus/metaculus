"use client";

import Image from "next/image";
import Link from "next/link";
import React from "react";

import cn from "@/utils/core/cn";

import FELogoDark from "../assets/FE-logo-dark.svg?url";
import FELogoLight from "../assets/FE-logo-light.svg?url";

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
  return (
    <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-center lg:justify-between">
      {/* Logo */}
      <div className="flex flex-col items-center lg:items-start">
        <Image
          src={FELogoLight}
          alt="FutureEval"
          width={269}
          height={62}
          className="h-auto w-[200px] dark:hidden sm:w-[269px]"
          priority
        />
        <Image
          src={FELogoDark}
          alt="FutureEval"
          width={269}
          height={62}
          className="hidden h-auto w-[200px] dark:block sm:w-[269px]"
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
        "pb-1 font-geist-mono text-sm font-medium transition-colors sm:text-base",
        isActive
          ? "text-violet-800 dark:text-violet-800-dark"
          : "text-gray-600 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-200"
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
