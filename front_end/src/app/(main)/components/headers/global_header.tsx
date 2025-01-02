"use client";

import { usePathname } from "next/navigation";
import { FC } from "react";

import { getWithDefaultHeader } from "@/utils/navigation";

import Header from "./header";

const GlobalHeader: FC = () => {
  const pathname = usePathname();
  const withDefaultHeader = getWithDefaultHeader(pathname);

  if (withDefaultHeader) {
    return <Header />;
  }

  return null;
};

export default GlobalHeader;
