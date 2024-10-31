"use client";

import { usePathname } from "next/navigation";
import { FC } from "react";

import Header from "./header";

const GlobalHeader: FC = () => {
  const pathname = usePathname();
  const withDefaultHeader =
    !pathname.match(/^\/questions\/(\d+)(\/.*)?$/) &&
    !pathname.startsWith("/community");

  if (withDefaultHeader) {
    return <Header />;
  }

  return null;
};

export default GlobalHeader;
