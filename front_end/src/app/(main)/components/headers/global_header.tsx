"use client";

import { usePathname } from "next/navigation";
import { FC } from "react";

import Header from "./header";

const GlobalHeader: FC = () => {
  const pathname = usePathname();
  const withDefaultHeader =
    !pathname.match(/^\/questions\/(\d+)(\/.*)?$/) &&
    !pathname.match(/^\/notebooks\/(\d+)(\/.*)?$/) &&
    !pathname.startsWith("/community") &&
    !pathname.startsWith("/questions/create");

  if (withDefaultHeader) {
    return <Header />;
  }

  return null;
};

export default GlobalHeader;
