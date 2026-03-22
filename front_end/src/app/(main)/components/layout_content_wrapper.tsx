"use client";

import { usePathname } from "next/navigation";
import { FC, ReactNode } from "react";

import cn from "@/utils/core/cn";
import { getWithDefaultHeader } from "@/utils/navigation";

type Props = {
  children: ReactNode;
};

const LayoutContentWrapper: FC<Props> = ({ children }) => {
  const pathname = usePathname();
  const hasHeader = getWithDefaultHeader(pathname);

  return (
    <div className={cn("flex min-h-screen flex-col", hasHeader && "pt-header")}>
      {children}
    </div>
  );
};

export default LayoutContentWrapper;
