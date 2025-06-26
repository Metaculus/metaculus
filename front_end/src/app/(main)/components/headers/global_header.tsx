"use client";

import { usePathname } from "next/navigation";
import { FC } from "react";

import { getWithDefaultHeader } from "@/utils/navigation";

import Header from "./header";

type Props = {
  forceDefault?: boolean;
};
const GlobalHeader: FC<Props> = ({ forceDefault = false }) => {
  const pathname = usePathname();
  const withDefaultHeader = forceDefault || getWithDefaultHeader(pathname);

  if (withDefaultHeader) {
    return <Header />;
  }

  return null;
};

export default GlobalHeader;
