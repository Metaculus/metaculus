"use client";

import { FC, PropsWithChildren } from "react";

import cn from "@/utils/core/cn";

type Props = PropsWithChildren & {
  title: string;
  className?: string;
};

const PreferencesSection: FC<Props> = ({ children, title, className }) => {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded border border-blue-400 p-6 text-blue-800 dark:border-blue-400-dark dark:text-blue-800-dark",
        className
      )}
    >
      <h3 className="m-0 text-xl/7 text-blue-900 dark:text-blue-900-dark">
        {title}
      </h3>
      {children}
    </div>
  );
};

export default PreferencesSection;
