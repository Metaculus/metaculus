"use client";

import { usePathname } from "next/navigation";
import { FC } from "react";

import { getWithDefaultHeader } from "@/utils/navigation";

import Header from "./header";

type Props = {
  forceDefault?: boolean;
  fixed?: boolean;
};
const GlobalHeader: FC<Props> = ({ forceDefault = false, fixed = true }) => {
  const pathname = usePathname();
  const withDefaultHeader = forceDefault || getWithDefaultHeader(pathname);

  if (withDefaultHeader) {
    return <Header fixed={fixed} />;
  }

  return null;
};

export default GlobalHeader;
