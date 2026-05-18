"use client";

import CommunityHeader from "./headers/community_header";
import Header from "./headers/header";
import { useTopChromeHeader } from "./top_chrome_header_context";

type Props = {
  defaultHeader?: React.ReactNode;
};

export const TopChromeHeaderSlot = ({ defaultHeader }: Props) => {
  const { activeHeader } = useTopChromeHeader();

  if (activeHeader?.type === "community") {
    return (
      <CommunityHeader
        community={activeHeader.community}
        alwaysShowName={activeHeader.alwaysShowName}
      />
    );
  }

  return defaultHeader || <Header />;
};
