"use client";

import Link from "next/link";
import React, { PropsWithChildren, useMemo } from "react";

import { TournamentPreview } from "@/types/projects";
import cn from "@/utils/core/cn";
import { getProjectLink } from "@/utils/navigation";

type Props = PropsWithChildren<{
  item: TournamentPreview;
  className?: string;
}>;

const TournamentCardShell: React.FC<Props> = ({
  item,
  className,
  children,
}) => {
  const href = useMemo(() => getProjectLink(item), [item]);

  return (
    <Link
      href={href}
      className={cn(
        "group block no-underline",
        "rounded-lg border border-blue-400 dark:border-blue-400-dark lg:rounded",
        "bg-gray-0/50 dark:bg-gray-0-dark/50",
        "shadow-sm transition-shadow hover:shadow-md",
        "overflow-hidden",
        className
      )}
    >
      {children}
    </Link>
  );
};

export default TournamentCardShell;
